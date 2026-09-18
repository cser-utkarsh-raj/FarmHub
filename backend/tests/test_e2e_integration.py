import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_farmer_onboarding_and_auth_e2e_flow():
    # 1. Register a new farmer matching FarmerOnboarding frontend payload
    farmer_payload = {
        "phone": "9811223344",
        "full_name": "Satish Yadav",
        "password": "secretfarmerpass",
        "role": "FARMER",
        "district": "Purnia",
        "land_area": 2.5,
        "local_land_unit": "bigha",
        "irrigation_availability": True,
        "crops": ["Maize", "Wheat"]
    }
    reg_res = client.post("/api/auth/register", json=farmer_payload)
    assert reg_res.status_code == 200, reg_res.text
    token_data = reg_res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "FARMER"
    assert token_data["phone"] == "9811223344"

    # 2. Duplicate registration attempt returns 400
    dup_res = client.post("/api/auth/register", json=farmer_payload)
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.json()["detail"]

    # 3. Login with credentials
    login_res = client.post("/api/auth/login", json={
        "phone": "9811223344",
        "password": "secretfarmerpass"
    })
    assert login_res.status_code == 200
    access_token = login_res.json()["access_token"]

    # 4. Fetch authenticated profile (/api/auth/me) used by Dashboard
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["full_name"] == "Satish Yadav"
    assert me_data["farmer_profile"]["district"] == "Purnia"
    assert me_data["farmer_profile"]["land_area"] == 2.5
    assert me_data["farmer_profile"]["local_land_unit"] == "bigha"

def test_crop_selection_to_economics_e2e():
    # 1. Fetch Bihar crop catalogue (CropSelection page)
    crops_res = client.get("/api/crops")
    assert crops_res.status_code == 200
    crops = crops_res.json()
    assert len(crops) >= 8
    crop_names = [c["name"] for c in crops]
    assert "Maize" in crop_names
    assert "Wheat" in crop_names

    # 2. Calculate profitability economics for selected crop (Profitability page)
    econ_payload = {
        "crop": "Maize",
        "land_area": 2.0,
        "local_land_unit": "bigha",
        "expected_selling_price_quintal": None
    }
    econ_res = client.post("/api/economics/calculate", json=econ_payload)
    assert econ_res.status_code == 200
    econ_data = econ_res.json()
    assert econ_data["crop"] == "Maize"
    assert "conservative" in econ_data["scenarios"]
    assert "expected" in econ_data["scenarios"]
    assert "high-price" in econ_data["scenarios"]
    assert econ_data["total_estimated_production_cost_inr"] > 0

def test_market_intelligence_and_comparison_e2e():
    # 1. Current prices query (PriceIntelligence page)
    prices_res = client.get("/api/market/prices/current?crop=Maize&district=Purnia")
    assert prices_res.status_code == 200
    prices = prices_res.json()
    assert len(prices) > 0
    assert prices[0]["district"] == "Purnia"
    assert prices[0]["modal_price"] > 0

    # 2. Market comparison query (MarketComparison page)
    compare_payload = {
        "farmer_district": "Purnia",
        "crop": "Maize",
        "quantity_quintals": 10.0,
        "transport_rate_per_km_quintal": 0.9
    }
    comp_res = client.post("/api/market/compare", json=compare_payload)
    assert comp_res.status_code == 200
    comp_items = comp_res.json()
    assert len(comp_items) > 0
    # Ranked descending by net realization
    net_vals = [m["estimated_net_realization_quintal"] for m in comp_items]
    assert net_vals == sorted(net_vals, reverse=True)
    assert comp_items[0]["is_best_net_value"] is True

def test_buyer_discovery_e2e():
    # Query buyers for Purnia maize (BuyerDiscovery page)
    buyers_res = client.get("/api/buyers?crop=Maize&district=Purnia")
    assert buyers_res.status_code == 200
    buyers = buyers_res.json()
    assert len(buyers) > 0
    assert any("Purnia" in b["operating_regions"] or b["district"] == "Purnia" for b in buyers)
