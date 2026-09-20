from __future__ import annotations

import os
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[2]
import sys
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.ml.core import clean_market_data
from backend.ml.providers.mandi_prices import fetch_mandi_prices

DEFAULT_COMMODITIES = (
    "Maize",
    "Wheat",
    "Paddy",
    "Potato",
    "Onion",
    "Tomato",
    "Mustard",
    "Gram",
    "Cauliflower",
)


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def post_batches(api_url: str, ingestion_key: str, records: list[dict]) -> dict:
    endpoint = api_url.rstrip("/") + "/api/market/ingest"
    totals = {"ingested_count": 0, "rejected_count": 0}
    with requests.Session() as session:
        session.headers.update({"X-Mandi-Ingestion-Key": ingestion_key})
        for start in range(0, len(records), 500):
            response = session.post(endpoint, json=records[start:start + 500], timeout=45)
            response.raise_for_status()
            payload = response.json()
            totals["ingested_count"] += int(payload.get("ingested_count", 0))
            totals["rejected_count"] += int(payload.get("rejected_count", 0))
    return totals


def main() -> None:
    data_key = required_env("DATA_GOV_IN_API_KEY")
    ingestion_key = required_env("MANDI_INGESTION_KEY")
    api_url = required_env("FARMHUB_API_URL")
    if not api_url.startswith(("http://", "https://")):
        api_url = "http://" + api_url

    commodities = [
        item.strip()
        for item in os.getenv("FARMHUB_SYNC_COMMODITIES", ",".join(DEFAULT_COMMODITIES)).split(",")
        if item.strip()
    ]
    frame = clean_market_data(fetch_mandi_prices(
        data_key,
        commodities,
        limit=int(os.getenv("FARMHUB_SYNC_PAGE_SIZE", "500")),
        max_pages=int(os.getenv("FARMHUB_SYNC_MAX_PAGES", "10")),
    ))
    if frame.empty:
        raise RuntimeError("Official Data.gov.in returned no usable Bihar mandi observations; refusing to overwrite market data.")

    records = []
    for row in frame.to_dict(orient="records"):
        records.append({
            "market": str(row["market"]),
            "district": str(row["district"]),
            "state": str(row["state"]),
            "commodity": str(row["commodity"]),
            "variety": str(row["variety"]),
            "grade": str(row.get("grade", "UNKNOWN")),
            "min_price": float(row["min_price"]),
            "max_price": float(row["max_price"]),
            "modal_price": float(row["modal_price"]),
            "record_date": pd.Timestamp(row["date"]).date().isoformat(),
            "arrivals_volume": 0,
            "unit": "INR/quintal",
        })

    totals = post_batches(api_url, ingestion_key, records)
    print({
        "source": "data.gov.in",
        "rows_fetched": len(records),
        **totals,
    })


if __name__ == "__main__":
    main()
