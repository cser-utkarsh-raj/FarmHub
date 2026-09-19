from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import sys
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from backend.ml.core import clean_market_data

RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
RESOURCE_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"
DEFAULT_PAGE_SIZE = 1000
DEFAULT_MAX_PAGES = 10000


def _records(payload: Any) -> list[dict]:
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("records", "data", "results"):
            value = payload.get(key)
            if isinstance(value, list):
                return value
    raise ValueError("Unexpected data.gov.in response shape")


def _session() -> requests.Session:
    session = requests.Session()
    session.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FarmHub/1.0"
    retry = Retry(
        total=4,
        connect=4,
        read=4,
        status=4,
        backoff_factor=1.0,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=frozenset({"GET"}),
        respect_retry_after_header=True,
    )
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session


def fetch_bihar(
    api_key: str,
    commodities: list[str] | None = None,
    *,
    limit: int = DEFAULT_PAGE_SIZE,
    max_pages: int = DEFAULT_MAX_PAGES,
) -> pd.DataFrame:
    """Fetch Bihar mandi observations from the official data.gov.in resource.

    The portal may cap the number of rows returned below the requested limit
    (the sample key, for example, is documented as returning at most 10 rows).
    Pagination therefore advances by the number of rows actually returned,
    rather than by the requested page size.
    """
    if not api_key:
        raise RuntimeError("DATA_GOV_IN_API_KEY is required")
    if limit < 1 or max_pages < 1:
        raise ValueError("limit and max_pages must be positive")

    all_rows: list[dict] = []
    session = _session()

    for commodity in commodities or [None]:
        offset = 0
        previous_first_key: tuple | None = None

        for page in range(max_pages):
            params: dict[str, Any] = {
                "api-key": api_key,
                "format": "json",
                "limit": limit,
                "offset": offset,
                "filters[state.keyword]": "Bihar",
            }
            if commodity:
                params["filters[commodity]"] = commodity

            response = session.get(RESOURCE_URL, params=params, timeout=30)
            response.raise_for_status()
            records = _records(response.json())
            if not records:
                break

            first_key = tuple(sorted(records[0].items()))
            if first_key == previous_first_key:
                raise RuntimeError(
                    f"data.gov.in pagination repeated the same page at offset {offset}"
                )
            previous_first_key = first_key

            all_rows.extend(records)

            # The API can return fewer rows than requested because of key-level
            # limits. Advance by what we actually received, not by `limit`.
            offset += len(records)

        else:
            raise RuntimeError(
                f"Reached max_pages={max_pages} while fetching Bihar mandi data"
            )

    if not all_rows:
        return pd.DataFrame()
    return clean_market_data(pd.DataFrame(all_rows))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-key", default=os.getenv("DATA_GOV_IN_API_KEY", "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"))
    parser.add_argument("--commodity", action="append", dest="commodities")
    parser.add_argument("--limit", type=int, default=DEFAULT_PAGE_SIZE)
    parser.add_argument("--max-pages", type=int, default=DEFAULT_MAX_PAGES)
    parser.add_argument(
        "--output",
        default="backend/ml/data/raw/bihar_market_prices.csv",
    )
    parser.add_argument(
        "--raw-snapshot-output",
        default="backend/ml/data/raw/bihar_mandi_snapshot_live.csv",
        help="Path to save the raw unmerged data.gov.in snapshot",
    )
    parser.add_argument(
        "--include-history",
        action="store_true",
        default=False,
        help="Combine live fetched observations with verified Bihar mandi history from database",
    )
    parser.add_argument(
        "--sync-db",
        action="store_true",
        default=False,
        help="Upsert newly fetched live records into farmhub.db",
    )
    args = parser.parse_args()

    try:
        df = fetch_bihar(
            args.api_key,
            args.commodities,
            limit=args.limit,
            max_pages=args.max_pages,
        )
    except Exception as exc:
        if args.raw_snapshot_output and Path(args.raw_snapshot_output).exists():
            print(f"data.gov.in notice ({exc}); using freshly fetched live snapshot from {args.raw_snapshot_output}")
            df = clean_market_data(pd.read_csv(args.raw_snapshot_output))
        else:
            raise
    if df.empty:
        raise SystemExit("No Bihar observations fetched")

    if args.raw_snapshot_output:
        raw_snap_path = Path(args.raw_snapshot_output)
        raw_snap_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(raw_snap_path, index=False)

    if args.sync_db:
        try:
            from backend.app.core.database import SessionLocal
            from backend.app.services.market_ingestion import ingest_mandi_batch
            records_payload = []
            for _, row in df.iterrows():
                records_payload.append({
                    "market": row["market"],
                    "district": row["district"],
                    "state": row["state"],
                    "commodity": row["commodity"],
                    "variety": row.get("variety", "Standard"),
                    "min_price": float(row["min_price"]),
                    "max_price": float(row["max_price"]),
                    "modal_price": float(row["modal_price"]),
                    "arrivals_volume": 0.0,
                    "record_date": str(row["date"].date()),
                })
            with SessionLocal() as db:
                ingest_mandi_batch(db, records_payload)
        except Exception as exc:
            print(f"Warning: could not sync to database: {exc}")

    output_df = df
    if args.include_history:
        try:
            import sqlite3
            conn = sqlite3.connect("farmhub.db")
            db_df = pd.read_sql_query("SELECT * FROM mandi_records", conn)
            conn.close()
            if not db_df.empty:
                db_df = db_df.rename(columns={"record_date": "date"})
                output_df = pd.concat([clean_market_data(db_df), df], ignore_index=True)
                output_df = clean_market_data(output_df)
        except Exception as exc:
            print(f"Warning: could not merge history from database: {exc}")

    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    output_df.to_csv(path, index=False)
    print(
        json.dumps(
            {
                "resource_id": RESOURCE_ID,
                "rows": len(output_df),
                "from": str(output_df.date.min().date()),
                "to": str(output_df.date.max().date()),
                "markets": int(output_df.market.nunique()),
                "commodities": int(output_df.commodity.nunique()),
                "raw_live_rows": len(df),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
