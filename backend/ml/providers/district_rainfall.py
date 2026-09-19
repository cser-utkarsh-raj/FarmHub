from __future__ import annotations

import pandas as pd

from .base import ProviderSpec, fetch_paginated, snake_case_columns

SPEC = ProviderSpec(
    resource_id="6c05cd1b-ed59-40c2-bc31-e314f39c6971",
    name="Daily District-wise Rainfall Data",
    default_filters={"State": "Bihar"},
)


def fetch_district_rainfall(
    api_key: str,
    districts: list[str] | None = None,
    years: list[str] | None = None,
    *,
    limit: int = 1000,
    max_pages: int = 10000,
) -> pd.DataFrame:
    rows: list[dict] = []
    for district in districts or [None]:
        for year in years or [None]:
            filters = {}
            if district:
                filters["District"] = district
            if year:
                filters["Year"] = year
            rows.extend(
                fetch_paginated(
                    SPEC, api_key, limit=limit, max_pages=max_pages, filters=filters
                )
            )
    return snake_case_columns(pd.DataFrame(rows)) if rows else pd.DataFrame()
