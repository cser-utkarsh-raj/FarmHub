from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

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
    parser.add_argument("--commodity", action="append", dest="commodities")
    parser.add_argument("--limit", type=int, default=DEFAULT_PAGE_SIZE)
    parser.add_argument("--max-pages", type=int, default=DEFAULT_MAX_PAGES)
    parser.add_argument(
        "--output",
        default="backend/ml/data/raw/bihar_market_prices.csv",
    )
    args = parser.parse_args()

    df = fetch_bihar(
        os.getenv("DATA_GOV_IN_API_KEY", ""),
        args.commodities,
        limit=args.limit,
        max_pages=args.max_pages,
    )
    if df.empty:
        raise SystemExit("No Bihar observations fetched")

    path = Path(args.output)
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    print(
        json.dumps(
            {
                "resource_id": RESOURCE_ID,
                "rows": len(df),
                "from": str(df.date.min().date()),
                "to": str(df.date.max().date()),
                "markets": int(df.market.nunique()),
                "commodities": int(df.commodity.nunique()),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
