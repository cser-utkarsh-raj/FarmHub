from datetime import date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from backend.app.core.database import get_db
from backend.app.models.market_price import MandiRecord
from backend.app.schemas.market import (
    MandiRecordResponse,
    MandiSummary,
    MarketPriceHistoryResponse,
    MarketComparisonItem,
    MarketComparisonRequest
)
from backend.app.services.market_comparator import compare_markets
from backend.app.services.market_ingestion import ingest_mandi_batch

router = APIRouter(prefix="/market", tags=["Mandi Market Data & Comparison"])

@router.get("/mandis", response_model=List[MandiSummary])
def list_mandis(db: Session = Depends(get_db)):
    """Returns list of all active Bihar mandis and commodities traded."""
    results = db.query(
        MandiRecord.market,
        MandiRecord.district,
        func.group_concat(MandiRecord.commodity).label("commodities")
    ).group_by(MandiRecord.market, MandiRecord.district).all()

    mandis = []
    for r in results:
        commodities = list(set([c.strip() for c in (r.commodities or "").split(",") if c.strip()]))
        mandis.append(MandiSummary(
            market=r.market,
            district=r.district,
            commodities_traded=sorted(commodities)
        ))
    return mandis

@router.get("/prices/current", response_model=List[MandiRecordResponse])
def get_current_prices(
    crop: Optional[str] = Query(None, description="Crop filter, e.g. Maize, Wheat"),
    district: Optional[str] = Query(None, description="District filter, e.g. Purnia, Patna"),
    market: Optional[str] = Query(None, description="Market filter, e.g. Gulabbagh"),
    db: Session = Depends(get_db)
):
    """Returns current reported mandi prices across Bihar."""
    # Subquery to get latest record_date for each market + commodity
    subquery = db.query(
        MandiRecord.market,
        MandiRecord.commodity,
        func.max(MandiRecord.record_date).label("max_date")
    ).group_by(MandiRecord.market, MandiRecord.commodity).subquery()

    query = db.query(MandiRecord).join(
        subquery,
        (MandiRecord.market == subquery.c.market) &
        (MandiRecord.commodity == subquery.c.commodity) &
        (MandiRecord.record_date == subquery.c.max_date)
    )

    if crop:
        query = query.filter(MandiRecord.commodity.ilike(f"%{crop.strip()}%"))
    if district:
        query = query.filter(MandiRecord.district.ilike(f"%{district.strip()}%"))
    if market:
        query = query.filter(MandiRecord.market.ilike(f"%{market.strip()}%"))

    return query.order_by(MandiRecord.commodity, MandiRecord.market).all()

@router.get("/prices/history", response_model=MarketPriceHistoryResponse)
def get_price_history(
    crop: str = Query(..., description="Crop name, e.g. Maize"),
    market: str = Query(..., description="Mandi name, e.g. Gulabbagh (Purnia)"),
    days: int = Query(90, ge=7, le=730, description="Historical range in days"),
    db: Session = Depends(get_db)
):
    """Returns historical daily records and descriptive statistics for a crop in a given mandi."""
    since_date = date.today() - timedelta(days=days)
    records = db.query(MandiRecord).filter(
        MandiRecord.commodity.ilike(f"%{crop.strip()}%"),
        MandiRecord.market.ilike(f"%{market.strip()}%"),
        MandiRecord.record_date >= since_date
    ).order_by(MandiRecord.record_date.asc()).all()

    if not records:
        # Check if record exists without date filter
        any_record = db.query(MandiRecord).filter(
            MandiRecord.commodity.ilike(f"%{crop.strip()}%"),
            MandiRecord.market.ilike(f"%{market.strip()}%")
        ).first()
        if not any_record:
            raise HTTPException(
                status_code=404,
                detail=f"No price records found for crop '{crop}' in market '{market}'."
            )

    prices = [r.modal_price for r in records]
    stats = {
        "count": len(prices),
        "min_modal_price": min(prices) if prices else 0.0,
        "max_modal_price": max(prices) if prices else 0.0,
        "avg_modal_price": round(sum(prices) / len(prices), 2) if prices else 0.0,
        "latest_modal_price": prices[-1] if prices else 0.0,
        "days_span": days
    }

    district_val = records[0].district if records else "Bihar"

    return MarketPriceHistoryResponse(
        commodity=crop,
        market=market,
        district=district_val,
        history=records,
        statistics=stats
    )

@router.post("/compare", response_model=List[MarketComparisonItem])
def compare_nearby_markets(
    payload: MarketComparisonRequest,
    db: Session = Depends(get_db)
):
    """
    Ranks nearby Bihar mandis by estimated net realization per quintal,
    accounting for distance, freight, handling, and mandi fees.
    """
    # Fetch latest prices for this crop across all Bihar mandis
    subquery = db.query(
        MandiRecord.market,
        MandiRecord.commodity,
        func.max(MandiRecord.record_date).label("max_date")
    ).filter(
        MandiRecord.commodity.ilike(f"%{payload.crop.strip()}%")
    ).group_by(MandiRecord.market, MandiRecord.commodity).subquery()

    records = db.query(MandiRecord).join(
        subquery,
        (MandiRecord.market == subquery.c.market) &
        (MandiRecord.commodity == subquery.c.commodity) &
        (MandiRecord.record_date == subquery.c.max_date)
    ).all()

    if not records:
        raise HTTPException(
            status_code=404,
            detail=f"No current mandi records available for crop '{payload.crop}' in Bihar."
        )

    prices_list = [
        {
            "market": r.market,
            "district": r.district,
            "modal_price": r.modal_price
        }
        for r in records
    ]

    comparison = compare_markets(
        farmer_district=payload.farmer_district,
        crop=payload.crop,
        quantity_quintals=payload.quantity_quintals,
        reported_prices=prices_list,
        transport_rate_per_km_quintal=payload.transport_rate_per_km_quintal,
        mandi_fee_pct=payload.mandi_fee_pct
    )
    return comparison

@router.post("/ingest")
def ingest_external_data(
    records: List[Dict[str, Any]],
    db: Session = Depends(get_db)
):
    """
    Data Ingestion pipeline endpoint.
    Separates external agricultural data ingestion from client retrieval.
    Validates, normalizes, and upserts mandi records.
    """
    result = ingest_mandi_batch(db, records)
    return result
