from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.ml.core import clean_market_data
from backend.ml.provenance import build_provenance
from backend.ml.providers.crop_production import SPEC as PRODUCTION_SPEC, fetch_crop_production
from backend.ml.providers.district_rainfall import SPEC as RAINFALL_SPEC, fetch_district_rainfall
from backend.ml.providers.mandi_prices import MANDI_SPEC, VARIETY_SPEC, fetch_mandi_prices, fetch_variety_prices

# Public Data.gov.in sample/demo credential for development only.
# Production and CI should provide DATA_GOV_IN_API_KEY through a secret store.
DEMO_API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"

DATASETS = {
    "mandi": {"filename": "bihar_market_prices.csv", "resource_id": MANDI_SPEC.resource_id, "name": MANDI_SPEC.name},
    "variety": {"filename": "bihar_variety_prices.csv", "resource_id": VARIETY_SPEC.resource_id, "name": VARIETY_SPEC.name},
    "rainfall": {"filename": "bihar_district_rainfall.csv", "resource_id": RAINFALL_SPEC.resource_id, "name": RAINFALL_SPEC.name},
    "production": {"filename": "bihar_crop_production.csv", "resource_id": PRODUCTION_SPEC.resource_id, "name": PRODUCTION_SPEC.name},
}

def _api_key(cli_value: str | None) -> str:
    value = cli_value or os.getenv("DATA_GOV_IN_API_KEY") or DEMO_API_KEY
    return value

def _fetch_dataset(name: str, args: argparse.Namespace, api_key: str):
    if name == "mandi":
        return clean_market_data(fetch_mandi_prices(api_key, args.commodity, limit=args.limit, max_pages=args.max_pages))
    if name == "variety":
        return fetch_variety_prices(api_key, args.commodity, limit=args.limit, max_pages=args.max_pages)
    if name == "rainfall":
        return fetch_district_rainfall(api_key, args.district, args.year, limit=args.limit, max_pages=args.max_pages)
    if name == "production":
        return fetch_crop_production(api_key, args.commodity, args.district, args.year, limit=args.limit, max_pages=args.max_pages)
    raise ValueError(f"Unknown dataset: {name}")

def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch verified Bihar datasets from Data.gov.in")
    parser.add_argument("--dataset", action="append", choices=[*DATASETS, "all"], default=None)
    parser.add_argument("--api-key", default=None, help=argparse.SUPPRESS)
    parser.add_argument("--commodity", action="append", default=None)
    parser.add_argument("--district", action="append", default=None)
    parser.add_argument("--year", action="append", default=None)
    parser.add_argument("--limit", type=int, default=1000)
    parser.add_argument("--max-pages", type=int, default=1000)
    parser.add_argument("--output-dir", default="backend/ml/data/raw")
    parser.add_argument("--provenance-dir", default="backend/ml/data/provenance")
    parser.add_argument("--output", default=None)
    parser.add_argument("--sync-db", action="store_true", help="Also upsert fetched mandi records into the application DB as verified observations")
    args = parser.parse_args()

    api_key = _api_key(args.api_key)
    selected = args.dataset or ["mandi"]
    if "all" in selected:
        selected = list(DATASETS)
    if args.output and len(selected) != 1:
        raise SystemExit("--output requires exactly one dataset")

    output_dir = Path(args.output_dir)
    provenance_dir = Path(args.provenance_dir)
    results = []
    for name in selected:
        spec = DATASETS[name]
        df = _fetch_dataset(name, args, api_key)
        if df.empty:
            raise SystemExit(f"No {name} observations fetched; refusing to write an empty dataset")
        if args.sync_db and name != "mandi":
            raise SystemExit("--sync-db is supported only for the mandi dataset")

        if args.sync_db:
            from backend.app.core.database import SessionLocal
            from backend.app.services.market_ingestion import ingest_mandi_batch
            payload = []
            for row in df.to_dict(orient="records"):
                payload.append({
                    "market": row["market"],
                    "district": row["district"],
                    "state": row["state"],
                    "commodity": row["commodity"],
                    "variety": row.get("variety") or "Standard",
                    "min_price": float(row["min_price"]),
                    "max_price": float(row["max_price"]),
                    "modal_price": float(row["modal_price"]),
                    "arrivals_volume": 0.0,
                    "record_date": str(row["date"].date()) if hasattr(row["date"], "date") else str(row["date"]),
                })
            with SessionLocal() as db:
                for start in range(0, len(payload), 500):
                    ingest_mandi_batch(db, payload[start:start + 500])

        output_path = Path(args.output) if args.output else output_dir / spec["filename"]
        output_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(output_path, index=False)
        provenance_path = provenance_dir / f"{name}.json"
        provenance = build_provenance(df, output_path, source="data.gov.in", resource_id=spec["resource_id"])
        provenance.save(provenance_path)
        results.append({"dataset": name, "resource_id": spec["resource_id"], "source": "data.gov.in", "rows": len(df), "from": provenance.date_min, "to": provenance.date_max, "output": str(output_path), "provenance": str(provenance_path)})
    print(json.dumps({"datasets": results}, indent=2))

if __name__ == "__main__":
    main()
