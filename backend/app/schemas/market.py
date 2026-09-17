from datetime import date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from backend.app.services.market_comparator import MarketComparisonItem, MarketComparisonRequest

class MandiRecordResponse(BaseModel):
    id: int
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

    model_config = ConfigDict(from_attributes=True)

class MandiSummary(BaseModel):
    market: str
    district: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    commodities_traded: List[str]

class MarketPriceHistoryResponse(BaseModel):
    commodity: str
    market: str
    district: str
    history: List[MandiRecordResponse]
    statistics: Dict[str, Any]

__all__ = [
    "MandiRecordResponse",
    "MandiSummary",
    "MarketPriceHistoryResponse",
    "MarketComparisonItem",
    "MarketComparisonRequest"
]
