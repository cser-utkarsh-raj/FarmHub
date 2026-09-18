from datetime import date, timedelta
from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_forecast_service_unavailable_insufficient_history():
    target_date = (date.today() + timedelta(days=20)).isoformat()
    payload = {
        "crop": "NonExistentCrop",
        "location": "Patna",
        "market": "Patna (Gulzarbagh)",
        "harvest_date": target_date
    }
    response = client.post("/forecast/price", json=payload)
    assert response.status_code == 503
    assert "Not enough verified Bihar mandi history" in response.json()["detail"]

def test_forecast_service_unavailable_without_model(monkeypatch):
    monkeypatch.setenv("FARMHUB_ML_MODEL_PATH", "backend/ml/models/nonexistent_model.joblib")
    target_date = (date.today() + timedelta(days=20)).isoformat()
    payload = {
        "crop": "Maize",
        "location": "Purnia",
        "market": "Gulabbagh (Purnia)",
        "harvest_date": target_date
    }
    response = client.post("/forecast/price", json=payload)
    assert response.status_code == 503
    assert "No trained FarmHub price model is installed" in response.json()["detail"]

def test_forecast_with_real_trained_model():
    target_date = (date.today() + timedelta(days=30)).isoformat()
    payload = {
        "crop": "Maize",
        "location": "Purnia",
        "market": "Gulabbagh (Purnia)",
        "harvest_date": target_date
    }
    response = client.post("/forecast/price", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["central_estimate"] > 0
    assert data["lower_bound"] <= data["central_estimate"] <= data["upper_bound"]
    assert data["model_version"] == "farmhub-global-hgb-v1"
    assert data["confidence"] in ["HIGH", "MODERATE", "LOW"]

def test_forecast_validation_errors():
    today = date.today()

    # Past date
    past_date = (today - timedelta(days=1)).isoformat()
    res_past = client.post("/forecast/price", json={
        "crop": "Maize",
        "location": "Purnia",
        "market": "Gulabbagh (Purnia)",
        "harvest_date": past_date
    })
    assert res_past.status_code == 400
    assert "harvest_date must be a future date" in res_past.json()["detail"]

    # Horizon > 90 days
    far_future = (today + timedelta(days=100)).isoformat()
    res_far = client.post("/forecast/price", json={
        "crop": "Maize",
        "location": "Purnia",
        "market": "Gulabbagh (Purnia)",
        "harvest_date": far_future
    })
    assert res_far.status_code == 400
    assert "FarmHub ML v1 supports forecast horizons up to 90 days" in res_far.json()["detail"]

    # Invalid date format
    res_fmt = client.post("/forecast/price", json={
        "crop": "Maize",
        "location": "Purnia",
        "market": "Gulabbagh (Purnia)",
        "harvest_date": "not-a-date"
    })
    assert res_fmt.status_code == 400
    assert "Invalid harvest_date format" in res_fmt.json()["detail"]

@patch("backend.app.services.forecast_engine.PriceInference")
def test_forecast_price_contract(mock_price_inference):
    mock_instance = MagicMock()
    mock_instance.predict.return_value = {
        "central_estimate": 2240.5,
        "lower_bound": 2010.0,
        "upper_bound": 2470.0,
        "horizon_days": 30,
        "model_version": "farmhub-global-hgb-v1",
        "trained_until": "2026-09-01",
        "calibration_horizon": 30
    }
    mock_price_inference.return_value = mock_instance

    target_date = (date.today() + timedelta(days=30)).isoformat()
    payload = {
        "crop": "Maize",
        "location": "Purnia",
        "market": "Gulabbagh (Purnia)",
        "harvest_date": target_date
    }

    # Test root endpoint contract POST /forecast/price
    response = client.post("/forecast/price", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()

    # Verify exact contract fields required by prompt
    assert data["central_estimate"] == 2240.5
    assert data["lower_bound"] == 2010.0
    assert data["upper_bound"] == 2470.0
    assert data["unit"] == "INR/quintal"
    assert data["forecast_date"] == date.today().isoformat()
    assert data["target_date"] == target_date
    assert data["model_version"] == "farmhub-global-hgb-v1"
    assert data["confidence"] in ["HIGH", "MODERATE", "LOW"]
    assert isinstance(data["limitations"], list)
    assert len(data["limitations"]) > 0

    # Bounds sanity
    assert data["lower_bound"] < data["central_estimate"] < data["upper_bound"]

@patch("backend.app.services.forecast_engine.PriceInference")
def test_forecast_price_api_prefix(mock_price_inference):
    mock_instance = MagicMock()
    mock_instance.predict.return_value = {
        "central_estimate": 2350.0,
        "lower_bound": 2150.0,
        "upper_bound": 2550.0,
        "horizon_days": 25,
        "model_version": "farmhub-global-hgb-v1",
        "trained_until": "2026-09-01",
        "calibration_horizon": 30
    }
    mock_price_inference.return_value = mock_instance

    target_date = (date.today() + timedelta(days=25)).isoformat()
    payload = {
        "crop": "Wheat",
        "location": "Patna",
        "market": "Patna (Gulzarbagh)",
        "harvest_date": target_date
    }
    response = client.post("/api/forecast/price", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["central_estimate"] == 2350.0
    assert data["target_date"] == target_date

