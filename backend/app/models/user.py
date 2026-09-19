import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class UserRole(str, enum.Enum):
    FARMER = "FARMER"
    DISTRIBUTOR = "DISTRIBUTOR"
    BUYER = "BUYER"

class VerificationStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    PHONE_VERIFIED = "PHONE_VERIFIED"
    BUSINESS_VERIFIED = "BUSINESS_VERIFIED"
    KYC_VERIFIED = "KYC_VERIFIED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.FARMER, nullable=False)
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.UNVERIFIED, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    buyer_profile = relationship("BuyerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    inquiries_sent = relationship("CropInquiry", foreign_keys="CropInquiry.farmer_id", back_populates="farmer")
    inquiries_received = relationship("CropInquiry", foreign_keys="CropInquiry.buyer_id", back_populates="buyer")
