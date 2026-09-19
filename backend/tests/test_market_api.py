import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_list_mandis():
    res = client.get("/api/market/mandis")
    assert res.status_code == 200
    mandis = res.json()
    assert len(mandis) > 0
    names = [m["market"] for m in mandis]
    assert any("Gulabbagh" in name for name in names)
    assert any("Patna" in name for name in names)

def test_current_prices_filter():
    res = client.get("/api/market/prices/current?crop=Maize")
    assert res.status_code == 200
    prices = res.json()
    assert len(prices) > 0
    for p in prices:
        assert "Maize" in p["commodity"]
        assert p["modal_price"] > 0

def test_price_history():
    res = client.get("/api/market/prices/history?crop=Maize&market=Gulabbagh (Purnia)&days=30")
    assert res.status_code == 200
    data = res.json()
    assert data["commodity"] == "Maize"
    assert len(data["history"]) > 0
    assert "avg_modal_price" in data["statistics"]

def test_market_comparison_net_realization():
    payload = {
        "farmer_district": "Purnia",
        "crop": "Maize",
        "quantity_quintals": 50.0,
        "transport_rate_per_km_quintal": 0.90
    }
    res = client.post("/api/market/compare", json=payload)
    assert res.status_code == 200
    comparison = res.json()
    assert len(comparison) > 0

    # Ensure mandis are ranked descending by net realization
    net_values = [item["estimated_net_realization_quintal"] for item in comparison]
    assert net_values == sorted(net_values, reverse=True)

    # First item must be tagged is_best_net_value = True
    assert comparison[0]["is_best_net_value"] is True

def test_ingestion_pipeline_validation():
    # Test valid ingestion
    records = [
        {
            "market": "gulabbagh",
            "district": "Purnia",
            "state": "Bihar",
            "commodity": "makka",  # Should be normalized to "Maize"
            "variety": "Hybrid-900M",
            "min_price": 2100.0,
            "max_price": 2250.0,
            "modal_price": 2180.0,
            "arrivals_volume": 450.0,
            "record_date": "2026-09-15"
        }
    ]
    headers = {"X-Mandi-Ingestion-Key": "test-mandi-ingestion-key"}
    res = client.post("/api/market/ingest", json=records, headers=headers)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["ingested_count"] == 1
    assert res_data["rejected_count"] == 0

    # Test invalid crop rejected
    invalid_records = [
        {
            "market": "Patna",
            "district": "Patna",
            "state": "Bihar",
            "commodity": "ExoticAvocado",
            "min_price": 1000.0,
            "max_price": 2000.0,
            "record_date": "2026-09-15"
        }
    ]
    bad_res = client.post("/api/market/ingest", json=invalid_records, headers=headers)
    assert bad_res.status_code == 200
    bad_data = bad_res.json()
    assert bad_data["rejected_count"] == 1
