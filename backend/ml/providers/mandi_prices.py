from __future__ import annotations

import pandas as pd

from .base import ProviderSpec, fetch_paginated

MANDI_SPEC = ProviderSpec(
    resource_id="9ef84268-d588-465a-a308-a864a43d0070",
    name="Current Daily Price of Various Commodities from Various Markets (Mandi)",
    default_filters={"state.keyword": "Bihar"},
)

VARIETY_SPEC = ProviderSpec(
    resource_id="35985678-0d79-46b4-9ed6-6f13308a1d24",
    name="Variety-wise Daily Market Prices Data of Commodity",
    default_filters={"State": "Bihar"},
)

PRICE_COLUMNS = ["state","district","market","commodity","variety","grade","date","min_price","max_price","modal_price"]
STATE_FILTER_CANDIDATES = ("state.keyword", "state")


def _normalize_price_rows(rows: list[dict]) -> pd.DataFrame:
    if not rows:
        return pd.DataFrame(columns=PRICE_COLUMNS)
    df = pd.DataFrame(rows).rename(columns={
        "State":"state","District":"district","Market":"market","Commodity":"commodity",
        "Variety":"variety","Grade":"grade","Arrival_Date":"date",
        "Min_Price":"min_price","Max_Price":"max_price","Modal_Price":"modal_price",
    })
    for column in PRICE_COLUMNS:
        if column not in df.columns:
            df[column] = None
    return df[PRICE_COLUMNS]


def fetch_mandi_prices(api_key: str, commodities: list[str] | None = None, *, limit: int = 1000, max_pages: int = 10000) -> pd.DataFrame:
    rows: list[dict] = []
    for commodity in commodities or [None]:
        commodity_filter = {"commodity": commodity} if commodity else None
        for state_field in STATE_FILTER_CANDIDATES:
            spec = ProviderSpec(
                resource_id=MANDI_SPEC.resource_id,
                name=MANDI_SPEC.name,
                default_filters={state_field: "Bihar"},
            )
            candidate = fetch_paginated(
                spec, api_key, limit=limit, max_pages=max_pages, filters=commodity_filter
            )
            if candidate:
                rows.extend(candidate)
                break
    return _normalize_price_rows(rows)


def fetch_variety_prices(api_key: str, commodities: list[str] | None = None, *, limit: int = 1000, max_pages: int = 10000) -> pd.DataFrame:
    rows: list[dict] = []
    for commodity in commodities or [None]:
        rows.extend(fetch_paginated(
            VARIETY_SPEC, api_key, limit=limit, max_pages=max_pages,
            filters={"Commodity": commodity} if commodity else None,
        ))
    return _normalize_price_rows(rows)
