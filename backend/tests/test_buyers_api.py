import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_buyer_directory_and_inquiries():
    # 1. Login as default farmer
    farmer_login = client.post("/api/auth/login", json={
        "phone": "9876543210",
        "password": "farmer123"
    })
    assert farmer_login.status_code == 200
    farmer_token = farmer_login.json()["access_token"]
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}

    # 2. Query buyers for Maize in Purnia
    buyers_res = client.get("/api/buyers?crop=Maize&district=Purnia")
    assert buyers_res.status_code == 200
    buyers = buyers_res.json()
    assert len(buyers) > 0
    target_buyer = buyers[0]
    buyer_user_id = target_buyer["user_id"]

    # 3. Farmer submits an inquiry
    inquiry_payload = {
        "buyer_id": buyer_user_id,
        "crop": "Maize",
        "quantity_quintals": 80.0,
        "expected_harvest_date": "2026-11-25",
        "target_price_inr": 2200.0,
        "notes": "Premium quality sun-dried maize, moisture < 12%."
    }
    inq_res = client.post(
        f"/api/buyers/{buyer_user_id}/inquire",
        json=inquiry_payload,
        headers=farmer_headers
    )
    assert inq_res.status_code == 200
    inquiry = inq_res.json()
    inquiry_id = inquiry["id"]
    assert inquiry["status"] == "PENDING"

    # 4. Login as Buyer
    buyer_login = client.post("/api/auth/login", json={
        "phone": "9876543211",
        "password": "buyer123"
    })
    assert buyer_login.status_code == 200
    buyer_token = buyer_login.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # 5. Buyer lists received inquiries
    buyer_inqs_res = client.get("/api/inquiries", headers=buyer_headers)
    assert buyer_inqs_res.status_code == 200
    received_inqs = buyer_inqs_res.json()
    assert any(i["id"] == inquiry_id for i in received_inqs)

    # 6. Buyer accepts the inquiry
    update_res = client.patch(
        f"/api/inquiries/{inquiry_id}/status",
        json={
            "status": "ACCEPTED",
            "buyer_response": "Rate accepted. Please bring sample to Gulabbagh mandi gate 2."
        },
        headers=buyer_headers
    )
    assert update_res.status_code == 200
    updated_inq = update_res.json()
    assert updated_inq["status"] == "ACCEPTED"
    assert "sample" in updated_inq["buyer_response"]
