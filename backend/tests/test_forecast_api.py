import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_forecast_price_contract():
    payload = {
        "crop": "Maize",
        "location": "Purnia",
        "market": "Gulabbagh",
        "harvest_date": "2026-11-20"
    }

    # Test root endpoint contract POST /forecast/price
    response = client.post("/forecast/price", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()

    # Verify exact contract fields required by prompt
    assert "central_estimate" in data
    assert "lower_bound" in data
    assert "upper_bound" in data
    assert "unit" in data
    assert data["unit"] == "INR/quintal"
    assert "forecast_date" in data
    assert "target_date" in data
    assert data["target_date"] == "2026-11-20"
    assert "model_version" in data
    assert "confidence" in data
    assert data["confidence"] in ["HIGH", "MODERATE", "LOW"]
    assert "limitations" in data
    assert isinstance(data["limitations"], list)
    assert len(data["limitations"]) > 0

    # Bounds sanity
    assert data["lower_bound"] < data["central_estimate"] < data["upper_bound"]

def test_forecast_price_api_prefix():
    # Also verify under /api/forecast/price
    payload = {
        "crop": "Wheat",
        "location": "Patna",
        "market": "Patna (Gulzarbagh)",
        "harvest_date": "2026-12-15"
    }
    response = client.post("/api/forecast/price", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["central_estimate"] > 0

def test_forecast_invalid_crop():
    payload = {
        "crop": "NonExistentCrop",
        "location": "Patna",
        "market": "Gulzarbagh",
        "harvest_date": "2026-11-20"
    }
    response = client.post("/forecast/price", json=payload)
    assert response.status_code == 400
