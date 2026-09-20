"""Regression tests for backend auth/API robustness fixes."""
from datetime import timedelta

from fastapi.testclient import TestClient

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.core.ratelimit import limiter
from backend.app.core.security import create_access_token
from backend.app.main import app
from backend.app.models.user import User

client = TestClient(app)


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def _register(phone, password="password123", role="FARMER", **extra):
    payload = {
        "phone": phone,
        "full_name": "Robustness Test",
        "password": password,
        "role": role,
    }
    payload.update(extra)
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 200, res.text
    return res.json()


def test_token_with_non_numeric_sub_is_401_not_500():
    bad = create_access_token({"sub": "not-a-number"})
    assert client.get("/api/auth/me", headers=_headers(bad)).status_code == 401


def test_expired_token_is_401():
    expired = create_access_token({"sub": "1"}, expires_delta=timedelta(seconds=-1))
    assert client.get("/api/auth/me", headers=_headers(expired)).status_code == 401


def test_disabled_user_cannot_login():
    data = _register("9000000001")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == data["user_id"]).first()
        user.is_active = False
        db.commit()
    finally:
        db.close()

    res = client.post(
        "/api/auth/login",
        json={"phone": "9000000001", "password": "password123"},
    )
    assert res.status_code == 401


def test_login_accepts_same_phone_formats_as_register():
    _register("+91 90000 00002")
    for phone in ("9000000002", "+91-90000-00002", "919000000002"):
        res = client.post(
            "/api/auth/login",
            json={"phone": phone, "password": "password123"},
        )
        assert res.status_code == 200, f"login failed for format {phone}"


def test_password_longer_than_72_chars_rejected():
    res = client.post(
        "/api/auth/register",
        json={
            "phone": "9000000003",
            "full_name": "Long Password",
            "password": "a" * 73,
        },
    )
    assert res.status_code == 422


def test_duplicate_email_returns_400_not_500():
    _register("9000000010", email="dupe@example.com")
    res = client.post(
        "/api/auth/register",
        json={
            "phone": "9000000011",
            "full_name": "Email Dupe",
            "password": "password123",
            "email": "dupe@example.com",
        },
    )
    assert res.status_code == 400


def test_duplicate_phone_returns_400():
    _register("9000000012")
    res = client.post(
        "/api/auth/register",
        json={
            "phone": "9000000012",
            "full_name": "Dupe",
            "password": "password123",
        },
    )
    assert res.status_code == 400


_user_seq = 100

def _unique_phone():
    global _user_seq
    _user_seq += 1
    return f"90000{_user_seq:05d}"


def _farmer_and_buyer():
    farmer = _register(_unique_phone(), role="FARMER")
    buyer = _register(_unique_phone(), role="BUYER", business_name="Test Traders")
    return farmer, buyer


def _inquiry_payload(buyer_id, **over):
    base = {
        "buyer_id": buyer_id,
        "crop": "Maize",
        "quantity_quintals": 10,
        "expected_harvest_date": "2026-12-01",
    }
    base.update(over)
    return base


def test_inquiry_requires_farmer_role():
    _, buyer = _farmer_and_buyer()
    other = _register(_unique_phone(), role="BUYER", business_name="Other Traders")
    res = client.post(
        f"/api/buyers/{buyer['user_id']}/inquire",
        json=_inquiry_payload(buyer["user_id"]),
        headers=_headers(other["access_token"]),
    )
    assert res.status_code == 403


def test_inquiry_body_buyer_id_must_match_path():
    farmer, buyer = _farmer_and_buyer()
    res = client.post(
        f"/api/buyers/{buyer['user_id']}/inquire",
        json=_inquiry_payload(buyer["user_id"] + 999),
        headers=_headers(farmer["access_token"]),
    )
    assert res.status_code == 400


def test_inquiry_rejects_invalid_date_and_negative_price():
    farmer, buyer = _farmer_and_buyer()
    url = f"/api/buyers/{buyer['user_id']}/inquire"
    h = _headers(farmer["access_token"])

    assert client.post(
        url,
        json=_inquiry_payload(buyer["user_id"], expected_harvest_date="not-a-date"),
        headers=h,
    ).status_code == 422

    assert client.post(
        url,
        json=_inquiry_payload(buyer["user_id"], target_price_inr=-5),
        headers=h,
    ).status_code == 422


def test_inquiry_status_must_be_allowed_value():
    farmer, buyer = _farmer_and_buyer()
    res = client.post(
        f"/api/buyers/{buyer['user_id']}/inquire",
        json=_inquiry_payload(buyer["user_id"]),
        headers=_headers(farmer["access_token"]),
    )
    assert res.status_code == 200
    inq_id = res.json()["id"]

    h = _headers(buyer["access_token"])
    res = client.patch(
        f"/api/inquiries/{inq_id}/status",
        json={"status": "HACKED"},
        headers=h,
    )
    assert res.status_code == 422

    res = client.patch(
        f"/api/inquiries/{inq_id}/status",
        json={"status": "accepted"},
        headers=h,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "ACCEPTED"


def test_ingest_rejects_oversized_batch():
    batch = [
        {
            "market": "Gulabbagh",
            "district": "Purnia",
            "commodity": "Maize",
            "min_price": 100,
            "max_price": 200,
            "record_date": "2026-09-18",
        }
    ] * 501

    res = client.post(
        "/api/market/ingest",
        json=batch,
        headers={"X-Mandi-Ingestion-Key": "test-mandi-ingestion-key"},
    )
    assert res.status_code == 422


def test_login_rate_limit_returns_429(monkeypatch):
    limiter.reset()
    monkeypatch.setattr(settings, "RATE_LIMIT_PER_MINUTE", 3)
    try:
        for _ in range(3):
            res = client.post(
                "/api/auth/login",
                json={"phone": "9000099999", "password": "nope"},
            )
            assert res.status_code == 401
        res = client.post(
            "/api/auth/login",
            json={"phone": "9000099999", "password": "nope"},
        )
        assert res.status_code == 429
    finally:
        limiter.reset()
