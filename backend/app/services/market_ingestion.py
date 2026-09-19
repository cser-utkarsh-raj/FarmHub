"""
Market Data Ingestion, Validation & Normalization Pipeline for FarmHub.
Separates external data acquisition from the client-facing API layer.
Architecture: External Data -> Ingestion -> Validation -> Normalization -> Database
"""
from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session
from backend.app.models.market_price import MandiRecord
from backend.app.core.logging import logger

COMMODITY_ALIASES = {
    "makka": "Maize", "corn": "Maize", "maize": "Maize",
    "gehun": "Wheat", "wheat": "Wheat",
    "dhaan": "Paddy", "paddy": "Paddy", "rice": "Paddy", "chawal": "Paddy",
    "alu": "Potato", "aloo": "Potato", "potato": "Potato",
    "pyaaz": "Onion", "pyaj": "Onion", "onion": "Onion",
    "tamatar": "Tomato", "tomato": "Tomato",
    "sarson": "Mustard", "rai": "Mustard", "mustard": "Mustard",
    "chana": "Gram", "gram": "Gram", "chana (gram)": "Gram",
    "phoolgobhi": "Cauliflower", "cauliflower": "Cauliflower",
}

MARKET_ALIASES = {
    "gulabbagh": "Gulabbagh (Purnia)", "purnia": "Gulabbagh (Purnia)",
    "gulabbagh (purnia)": "Gulabbagh (Purnia)", "patna": "Patna (Gulzarbagh)",
    "gulzarbagh": "Patna (Gulzarbagh)", "mithapur": "Patna (Mithapur)",
    "bihar sharif": "Bihar Sharif (Nalanda)", "nalanda": "Bihar Sharif (Nalanda)",
    "muzaffarpur": "Muzaffarpur (Brahmpura)", "brahmpura": "Muzaffarpur (Brahmpura)",
    "samastipur": "Samastipur", "begusarai": "Begusarai", "bhagalpur": "Bhagalpur",
    "gaya": "Gaya", "sasaram": "Sasaram (Rohtas)", "hajipur": "Hajipur (Vaishali)",
}


class RawMandiPayload(BaseModel):
    market: str
    district: str
    state: str = "Bihar"
    commodity: str
    variety: Optional[str] = "Standard"
    min_price: float
    max_price: float
    modal_price: Optional[float] = None
    arrivals_volume: Optional[float] = 0.0
    unit: Optional[str] = "INR/quintal"
    record_date: str


class NormalizedMandiRecord(BaseModel):
    market: str
    district: str
    state: str
    commodity: str
    variety: str
    min_price: float
    max_price: float
    modal_price: float
    arrivals_volume: float
    unit: str
    record_date: date


def validate_and_normalize(raw: Dict[str, Any]) -> Tuple[Optional[NormalizedMandiRecord], Optional[str]]:
    """Validate schema constraints, normalize aliases and enforce price sanity."""
    try:
        parsed = RawMandiPayload(**raw)
    except ValidationError as exc:
        return None, f"Schema validation error: {exc}"

    canonical_comm = COMMODITY_ALIASES.get(parsed.commodity.strip().lower())
    if not canonical_comm:
        return None, f"Commodity '{parsed.commodity}' is outside Bihar V1 supported scope."

    canonical_mkt = MARKET_ALIASES.get(parsed.market.strip().lower(), parsed.market.strip())
    try:
        parsed_date = datetime.strptime(parsed.record_date, "%Y-%m-%d").date()
    except ValueError:
        return None, f"Invalid date format '{parsed.record_date}'. Must be YYYY-MM-DD."

    if parsed.min_price <= 0 or parsed.max_price <= 0:
        return None, "Prices must be positive numbers."
    if parsed.min_price > parsed.max_price:
        return None, f"Min price ({parsed.min_price}) cannot exceed max price ({parsed.max_price})."

    modal = parsed.modal_price
    if modal is None or modal <= 0 or modal < parsed.min_price or modal > parsed.max_price:
        modal = round((parsed.min_price + parsed.max_price) / 2.0, 2)

    return NormalizedMandiRecord(
        market=canonical_mkt,
        district=parsed.district.strip(),
        state=parsed.state.strip() or "Bihar",
        commodity=canonical_comm,
        variety=parsed.variety.strip() if parsed.variety else "Standard",
        min_price=round(parsed.min_price, 2),
        max_price=round(parsed.max_price, 2),
        modal_price=round(modal, 2),
        arrivals_volume=max(0.0, float(parsed.arrivals_volume or 0.0)),
        unit="INR/quintal",
        record_date=parsed_date,
    ), None


def ingest_mandi_batch(db: Session, records_raw: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate, normalize and upsert a batch of market records."""
    ingested_count = 0
    rejected_count = 0
    rejections = []

    for raw in records_raw:
        norm, err = validate_and_normalize(raw)
        if err:
            rejected_count += 1
            rejections.append({"payload": raw, "reason": err})
            continue

        # Include the complete series identity: a market can report multiple
        # varieties for the same commodity on the same day.
        existing = db.query(MandiRecord).filter(
            MandiRecord.state == norm.state,
            MandiRecord.district == norm.district,
            MandiRecord.market == norm.market,
            MandiRecord.commodity == norm.commodity,
            MandiRecord.variety == norm.variety,
            MandiRecord.record_date == norm.record_date,
        ).first()

        if existing:
            existing.min_price = norm.min_price
            existing.max_price = norm.max_price
            existing.modal_price = norm.modal_price
            existing.arrivals_volume = norm.arrivals_volume
            existing.unit = norm.unit
            existing.is_synthetic = False
        else:
            db.add(MandiRecord(
                market=norm.market,
                district=norm.district,
                state=norm.state,
                commodity=norm.commodity,
                variety=norm.variety,
                min_price=norm.min_price,
                max_price=norm.max_price,
                modal_price=norm.modal_price,
                arrivals_volume=norm.arrivals_volume,
                unit=norm.unit,
                record_date=norm.record_date,
                is_synthetic=False,
            ))
        ingested_count += 1

    db.commit()
    logger.info(
        "Mandi Ingestion Complete: %s processed, %s rejected.",
        ingested_count,
        rejected_count,
    )
    return {
        "status": "success",
        "ingested_count": ingested_count,
        "rejected_count": rejected_count,
        "rejections": rejections[:10],
    }
