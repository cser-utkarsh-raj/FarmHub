from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.models.user import VerificationStatus

class BuyerDirectoryItem(BaseModel):
    id: int
    user_id: int
    business_name: str
    district: str
    state: str
    operating_regions: List[str]
    crops_purchased: List[str]
    approx_monthly_quantity_quintals: float
    verification_status: VerificationStatus
    contact_method: str

class InquiryCreate(BaseModel):
    buyer_id: int
    crop: str
    quantity_quintals: float = Field(gt=0)
    expected_harvest_date: str
    target_price_inr: Optional[float] = None
    notes: Optional[str] = None

class InquiryStatusUpdate(BaseModel):
    status: str = Field(..., description="PENDING, ACCEPTED, DECLINED, CONTACTED")
    buyer_response: Optional[str] = None

class InquiryResponse(BaseModel):
    id: int
    farmer_id: int
    buyer_id: int
    farmer_name: str
    farmer_phone: str
    buyer_business_name: str
    crop: str
    quantity_quintals: float
    expected_harvest_date: str
    target_price_inr: Optional[float]
    notes: Optional[str]
    status: str
    buyer_response: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
