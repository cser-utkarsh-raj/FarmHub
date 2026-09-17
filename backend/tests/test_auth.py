import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_farmer_registration_and_login():
    reg_payload = {
        "phone": "9911223344",
        "full_name": "Kailash Mahto",
        "password": "farmerpassword123",
        "role": "FARMER",
        "district": "Samastipur",
        "land_area": 3.5,
        "local_land_unit": "bigha",
        "crops": ["Maize", "Potato"]
    }
    # Register
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 200, res.text
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "FARMER"
    token = token_data["access_token"]

    # Access /api/auth/me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["full_name"] == "Kailash Mahto"
    assert user_data["farmer_profile"]["district"] == "Samastipur"
    assert user_data["farmer_profile"]["local_land_unit"] == "bigha"

    # Login
    login_res = client.post("/api/auth/login", json={
        "phone": "9911223344",
        "password": "farmerpassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

def test_buyer_registration():
    buyer_payload = {
        "phone": "9922334455",
        "full_name": "Sunil Agrawal",
        "password": "buyerpassword123",
        "role": "BUYER",
        "business_name": "Agrawal Grain Logistics",
        "district": "Purnia",
        "operating_regions": ["Purnia", "Katihar"],
        "crops_purchased": ["Maize", "Wheat"]
    }
    res = client.post("/api/auth/register", json=buyer_payload)
    assert res.status_code == 200
    token_data = res.json()
    assert token_data["role"] == "BUYER"

    # Verify duplicate phone error
    dup_res = client.post("/api/auth/register", json=buyer_payload)
    assert dup_res.status_code == 400

def test_login_invalid_password():
    res = client.post("/api/auth/login", json={
        "phone": "9876543210",
        "password": "wrongpassword"
    })
    assert res.status_code == 401
