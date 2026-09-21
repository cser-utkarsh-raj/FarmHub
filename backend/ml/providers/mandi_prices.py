from __future__ import annotations

import pandas as pd

from .base import ProviderSpec, fetch_paginated

MANDI_SPEC = ProviderSpec("9ef84268-d588-465a-a308-a864a43d0070", "Current Daily Price of Various Commodities from Various Markets (Mandi)", {})
VARIETY_SPEC = ProviderSpec("35985678-0d79-46b4-9ed6-6f13308a1d24", "Variety-wise Daily Market Prices Data of Commodity", {"State": "Bihar"})
PRICE_COLUMNS = ["state", "district", "market", "commodity", "variety", "grade", "date", "min_price", "max_price", "modal_price"]
STATE_FILTER_CANDIDATES = ("state.keyword", "state")

_FIELD_ALIASES = {
    "state": "state",
    "district": "district",
    "market": "market",
    "commodity": "commodity",
    "variety": "variety",
    "grade": "grade",
    "arrival_date": "date",
    "date": "date",
    "min_price": "min_price",
    "max_price": "max_price",
    "modal_price": "modal_price",
}


def _normalize_price_rows(rows: list[dict]) -> pd.DataFrame:
    if not rows:
        return pd.DataFrame(columns=PRICE_COLUMNS)

    normalized_rows = []
    for row in rows:
        normalized = {}
        for key, value in row.items():
            canonical = _FIELD_ALIASES.get(str(key).strip().casefold())
            if canonical:
                normalized[canonical] = value
        normalized_rows.append(normalized)

    df = pd.DataFrame(normalized_rows)
    for column in PRICE_COLUMNS:
        if column not in df.columns:
            df[column] = None
    return df[PRICE_COLUMNS]


def _fetch_mandi_candidate(api_key: str, commodity: str | None, *, limit: int, max_pages: int) -> list[dict]:
    filters = {"commodity": commodity} if commodity else None
    # The API has exposed both state.keyword and state over time. An empty
    # result is the only safe signal to try the next spelling; HTTP/API errors
    # are deliberately propagated instead of being hidden.
    for field in STATE_FILTER_CANDIDATES:
        rows = fetch_paginated(ProviderSpec(MANDI_SPEC.resource_id, MANDI_SPEC.name, {field: "Bihar"}), api_key, limit=limit, max_pages=max_pages, filters=filters)
        if rows:
            return rows
    # Some deployments ignore/reject state filters and return no rows. Fetch
    # the bounded unfiltered result and retain only explicitly Bihar records.
    rows = fetch_paginated(MANDI_SPEC, api_key, limit=limit, max_pages=max_pages, filters=filters)
    return [row for row in rows if str(row.get("State", row.get("state", ""))).strip().casefold() == "bihar"]


def fetch_mandi_prices(api_key: str, commodities: list[str] | None = None, *, limit: int = 1000, max_pages: int = 10000) -> pd.DataFrame:
    rows: list[dict] = []
    for commodity in commodities or [None]:
        rows.extend(_fetch_mandi_candidate(api_key, commodity, limit=limit, max_pages=max_pages))
    return _normalize_price_rows(rows)


def fetch_variety_prices(api_key: str, commodities: list[str] | None = None, *, limit: int = 1000, max_pages: int = 10000) -> pd.DataFrame:
    rows: list[dict] = []
    for commodity in commodities or [None]:
        rows.extend(fetch_paginated(VARIETY_SPEC, api_key, limit=limit, max_pages=max_pages, filters={"Commodity": commodity} if commodity else None))
    return _normalize_price_rows(rows)
