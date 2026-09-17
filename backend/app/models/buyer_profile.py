import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.user import VerificationStatus

class BuyerProfile(Base):
    __tablename__ = "buyer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    business_name = Column(String(150), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), default="Bihar", nullable=False)
    operating_regions_json = Column(Text, default="[]")  # e.g. ["Purnia", "Katihar", "Saharsa"]

    crops_purchased_json = Column(Text, default="[]")  # e.g. ["Maize", "Wheat", "Paddy"]
    approx_monthly_quantity_quintals = Column(Float, default=100.0)

    contact_method = Column(String(50), default="PHONE")  # PHONE, WHATSAPP, IN_PERSON
    contact_phone = Column(String(20), nullable=False)

    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.UNVERIFIED, nullable=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="buyer_profile")

    @property
    def operating_regions(self):
        try:
            return json.loads(self.operating_regions_json) if self.operating_regions_json else []
        except Exception:
            return []

    @operating_regions.setter
    def operating_regions(self, value):
        self.operating_regions_json = json.dumps(value)

    @property
    def crops_purchased(self):
        try:
            return json.loads(self.crops_purchased_json) if self.crops_purchased_json else []
        except Exception:
            return []

    @crops_purchased.setter
    def crops_purchased(self, value):
        self.crops_purchased_json = json.dumps(value)
