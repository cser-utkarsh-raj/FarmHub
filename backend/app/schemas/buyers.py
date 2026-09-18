from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
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

ALLOWED_INQUIRY_STATUSES = {"PENDING", "ACCEPTED", "DECLINED", "CONTACTED"}


class InquiryCreate(BaseModel):
    buyer_id: int
    crop: str = Field(..., min_length=1, max_length=100)
    quantity_quintals: float = Field(gt=0)
    expected_harvest_date: str
    target_price_inr: Optional[float] = Field(default=None, gt=0)
    notes: Optional[str] = None

    @field_validator("expected_harvest_date")
    @classmethod
    def validate_harvest_date(cls, v):
        try:
            date.fromisoformat(v)
        except (ValueError, TypeError):
            raise ValueError("expected_harvest_date must be a valid date (YYYY-MM-DD).")
        return v


class InquiryStatusUpdate(BaseModel):
    status: str = Field(..., description="PENDING, ACCEPTED, DECLINED, CONTACTED")
    buyer_response: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        normalized = v.strip().upper()
        if normalized not in ALLOWED_INQUIRY_STATUSES:
            raise ValueError(
                f"Invalid inquiry status '{v}'. Allowed: {sorted(ALLOWED_INQUIRY_STATUSES)}"
            )
        return normalized

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
