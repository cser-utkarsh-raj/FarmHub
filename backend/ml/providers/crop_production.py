from __future__ import annotations

import pandas as pd

from .base import ProviderSpec, fetch_paginated, snake_case_columns

SPEC = ProviderSpec(
    resource_id="35be999b-0208-4354-b557-f6ca9a5355de",
    name="District-wise, season-wise crop production statistics from 1997",
    default_filters={"state_name": "Bihar"},
)


def fetch_crop_production(
    api_key: str,
    crops: list[str] | None = None,
    districts: list[str] | None = None,
    crop_years: list[str] | None = None,
    *,
    limit: int = 1000,
    max_pages: int = 10000,
) -> pd.DataFrame:
    rows: list[dict] = []
    for crop in crops or [None]:
        for district in districts or [None]:
            for crop_year in crop_years or [None]:
                filters = {}
                if crop:
                    filters["crop"] = crop
                if district:
                    filters["district_name"] = district
                if crop_year:
                    filters["crop_year"] = crop_year
                rows.extend(
                    fetch_paginated(
                        SPEC, api_key, limit=limit, max_pages=max_pages, filters=filters
                    )
                )
    return snake_case_columns(pd.DataFrame(rows)) if rows else pd.DataFrame()
