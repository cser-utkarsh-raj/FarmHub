from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict
import re
from backend.app.models.user import UserRole, VerificationStatus

class UserCreate(BaseModel):
    phone: str = Field(..., description="Indian 10-digit mobile number")
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6)
    role: UserRole = Field(default=UserRole.FARMER)
    email: Optional[str] = None

    # Farmer profile fields (optional if role is FARMER)
    district: Optional[str] = "Patna"
    land_area: Optional[float] = 1.0
    local_land_unit: Optional[str] = "bigha"
    irrigation_availability: Optional[bool] = True
    crops: Optional[List[str]] = []

    # Buyer profile fields (optional if role is BUYER or DISTRIBUTOR)
    business_name: Optional[str] = None
    operating_regions: Optional[List[str]] = []
    crops_purchased: Optional[List[str]] = []

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        digits = re.sub(r"\D", "", v)
        if len(digits) == 10:
            return digits
        elif len(digits) == 12 and digits.startswith("91"):
            return digits[2:]
        raise ValueError("Invalid phone number. Must be a 10-digit mobile number.")

class UserLogin(BaseModel):
    phone: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    role: UserRole
    phone: str
    verification_status: VerificationStatus

class FarmerProfileResponse(BaseModel):
    id: int
    district: str
    block_or_village: Optional[str]
    state: str
    preferred_language: str
    land_area: float
    local_land_unit: str
    irrigation_availability: bool
    irrigation_type: str
    crops: List[str]
    farming_information: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class BuyerProfileResponse(BaseModel):
    id: int
    business_name: str
    district: str
    state: str
    operating_regions: List[str]
    crops_purchased: List[str]
    approx_monthly_quantity_quintals: float
    contact_method: str
    contact_phone: str
    verification_status: VerificationStatus

    model_config = ConfigDict(from_attributes=True)

class UserResponse(BaseModel):
    id: int
    phone: str
    email: Optional[str]
    full_name: str
    role: UserRole
    verification_status: VerificationStatus
    is_active: bool
    farmer_profile: Optional[FarmerProfileResponse] = None
    buyer_profile: Optional[BuyerProfileResponse] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
