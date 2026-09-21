"""Tests for official Data.gov.in provider behavior."""
import pytest

from backend.ml.providers.base import ProviderSpec, fetch_paginated
from backend.ml.providers.mandi_prices import fetch_mandi_prices
from backend.ml.scripts.data_ingestion import _api_key


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self.payload = payload
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            import requests
            raise requests.HTTPError(response=self)

    def json(self):
        return self.payload


class FakeSession:
    def __init__(self, pages):
        self.pages = list(pages)
        self.calls = []

    def get(self, url, params, timeout):
        self.calls.append(params.copy())
        return FakeResponse(self.pages.pop(0) if self.pages else {"records": []})


def test_pagination_uses_returned_row_count():
    spec = ProviderSpec("TEST FIXTURE", "TEST FIXTURE", {})
    session = FakeSession([
        {"records": [{"id": 1}, {"id": 2}]},
        {"records": [{"id": 3}]},
        {"records": []},
    ])
    rows = fetch_paginated(spec, "test", limit=1000, session=session)
    assert len(rows) == 3
    assert [c["offset"] for c in session.calls] == [0, 2, 3]


def test_malformed_payload_fails():
    spec = ProviderSpec("TEST FIXTURE", "TEST FIXTURE", {})
    with pytest.raises(ValueError):
        fetch_paginated(spec, "test", session=FakeSession([{"unexpected": []}]))


def test_missing_key_fails_closed():
    spec = ProviderSpec("TEST FIXTURE", "TEST FIXTURE", {})
    with pytest.raises(RuntimeError, match="DATA_GOV_IN_API_KEY"):
        fetch_paginated(spec, "", session=FakeSession([]))


def test_api_key_requires_runtime_secret(monkeypatch):
    monkeypatch.delenv("DATA_GOV_IN_API_KEY", raising=False)
    with pytest.raises(RuntimeError, match="DATA_GOV_IN_API_KEY"):
        _api_key(None)


def test_mandi_fields_are_normalized(monkeypatch):
    def fake_fetch(spec, api_key, **kwargs):
        assert spec.resource_id == "9ef84268-d588-465a-a308-a864a43d0070"
        return [{
            "State": "Bihar", "District": "Purnia", "Market": "Gulabbagh",
            "Commodity": "Maize", "Variety": "Hybrid", "Grade": "FAQ",
            "Arrival_Date": "2026-09-18", "Min_Price": "2000",
            "Max_Price": "2200", "Modal_Price": "2100",
        }]

    monkeypatch.setattr("backend.ml.providers.mandi_prices.fetch_paginated", fake_fetch)
    df = fetch_mandi_prices("test", ["Maize"])
    assert df.iloc[0]["district"] == "Purnia"
    assert df.iloc[0]["date"] == "2026-09-18"
    assert df.iloc[0]["modal_price"] == "2100"


def test_mandi_lowercase_fields_are_normalized(monkeypatch):
    def fake_fetch(spec, api_key, **kwargs):
        return [{
            "state": "Bihar", "district": "Purnia", "market": "Gulabbagh",
            "commodity": "Maize", "variety": "Hybrid", "grade": "FAQ",
            "arrival_date": "2026-09-18", "min_price": "2000",
            "max_price": "2200", "modal_price": "2100",
        }]

    monkeypatch.setattr("backend.ml.providers.mandi_prices.fetch_paginated", fake_fetch)
    df = fetch_mandi_prices("test", ["Maize"])
    assert df.iloc[0]["state"] == "Bihar"
    assert df.iloc[0]["district"] == "Purnia"
    assert df.iloc[0]["date"] == "2026-09-18"
    assert df.iloc[0]["modal_price"] == "2100"


def test_mandi_mixed_case_fields_are_normalized(monkeypatch):
    def fake_fetch(spec, api_key, **kwargs):
        return [{
            "STATE": "Bihar", "District": "Purnia", "market": "Gulabbagh",
            "Commodity": "Maize", "VARIETY": "Hybrid", "Grade": "FAQ",
            "arrival_date": "2026-09-18", "Min_Price": "2000",
            "max_price": "2200", "Modal_Price": "2100",
        }]

    monkeypatch.setattr("backend.ml.providers.mandi_prices.fetch_paginated", fake_fetch)
    df = fetch_mandi_prices("test", ["Maize"])
    assert df.iloc[0]["state"] == "Bihar"
    assert df.iloc[0]["district"] == "Purnia"
    assert df.iloc[0]["date"] == "2026-09-18"
    assert df.iloc[0]["modal_price"] == "2100"


def test_mandi_state_filter_fallback(monkeypatch):
    calls = []

    def fake_fetch(spec, api_key, **kwargs):
        calls.append((dict(spec.default_filters), dict(kwargs.get("filters") or {})))
        if spec.default_filters.get("state") == "Bihar":
            return [{
                "State": "Bihar", "District": "Purnia", "Market": "Gulabbagh",
                "Commodity": "Maize", "Variety": "Hybrid", "Grade": "FAQ",
                "Arrival_Date": "2026-09-18", "Min_Price": "2000",
                "Max_Price": "2200", "Modal_Price": "2100",
            }]
        return []

    monkeypatch.setattr("backend.ml.providers.mandi_prices.fetch_paginated", fake_fetch)
    df = fetch_mandi_prices("test", ["Maize"])
    assert len(calls) == 2
    assert calls[0][0] == {"state.keyword": "Bihar"}
    assert calls[1][0] == {"state": "Bihar"}
    assert calls[0][1] == {"commodity": "Maize"}
    assert calls[1][1] == {"commodity": "Maize"}
    assert df.iloc[0]["state"] == "Bihar"


def test_no_hardcoded_api_key_in_source():
    from pathlib import Path
    source = Path("backend/ml/scripts/data_ingestion.py").read_text(encoding="utf-8")
    assert "DEMO_API_KEY" not in source
