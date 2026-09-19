from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_URL = "https://api.data.gov.in/resource"


@dataclass(frozen=True)
class ProviderSpec:
    resource_id: str
    name: str
    default_filters: Mapping[str, str]


def _session() -> requests.Session:
    session = requests.Session()
    session.headers["User-Agent"] = "FarmHub/1.0"
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


def _extract_records(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]
    if not isinstance(payload, dict):
        raise ValueError("Unexpected Data.gov.in response shape")
    for key in ("records", "data", "results"):
        records = payload.get(key)
        if isinstance(records, list):
            return [row for row in records if isinstance(row, dict)]
    raise ValueError("Unexpected Data.gov.in response shape: records/data/results missing")


def fetch_paginated(spec: ProviderSpec, api_key: str, *, limit: int = 1000, max_pages: int = 10000,
                    filters: Mapping[str, str] | None = None, session: requests.Session | None = None) -> list[dict[str, Any]]:
    if not api_key:
        raise RuntimeError("DATA_GOV_IN_API_KEY is required")
    if limit < 1 or max_pages < 1:
        raise ValueError("limit and max_pages must be positive")

    http = session or _session()
    rows: list[dict[str, Any]] = []
    offset = 0
    previous_first_key: tuple[Any, ...] | None = None
    merged_filters = dict(spec.default_filters)
    merged_filters.update(filters or {})

    for _ in range(max_pages):
        params: dict[str, Any] = {"api-key": api_key, "format": "json", "limit": limit, "offset": offset}
        for field, value in merged_filters.items():
            if value is not None and str(value).strip():
                params[f"filters[{field}]"] = value

        response = http.get(f"{BASE_URL}/{spec.resource_id}", params=params, timeout=30)
        try:
            response.raise_for_status()
        except requests.HTTPError as exc:
            raise RuntimeError(
                f"Data.gov.in request failed for {spec.resource_id}: HTTP {response.status_code}"
            ) from exc

        records = _extract_records(response.json())
        if not records:
            break

        first_key = tuple(sorted(records[0].items()))
        if first_key == previous_first_key:
            raise RuntimeError(f"Data.gov.in pagination repeated at offset {offset}")
        previous_first_key = first_key
        rows.extend(records)
        offset += len(records)
    else:
        raise RuntimeError(f"Reached max_pages={max_pages} while fetching {spec.resource_id}")

    return rows


def snake_case_columns(df: pd.DataFrame) -> pd.DataFrame:
    return df.rename(columns={
        column: str(column).strip().lower().replace(" ", "_").replace("-", "_")
        for column in df.columns
    })
