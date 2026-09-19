import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    district = Column(String(100), nullable=False)
    block_or_village = Column(String(100), nullable=True)
    state = Column(String(100), default="Bihar", nullable=False)
    preferred_language = Column(String(10), default="hi", nullable=False)

    land_area = Column(Float, nullable=False, default=1.0)
    local_land_unit = Column(String(20), default="bigha", nullable=False)  # bigha, katha, acre, hectare

    irrigation_availability = Column(Boolean, default=True)
    irrigation_type = Column(String(50), default="borewell_diesel")  # borewell_diesel, borewell_electric, canal, rainfed

    crops_json = Column(Text, default="[]")  # e.g. ["Maize", "Wheat", "Potato"]
    farming_information = Column(Text, nullable=True)  # additional operational notes

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="farmer_profile")

    @property
    def crops(self):
        try:
            return json.loads(self.crops_json) if self.crops_json else []
        except Exception:
            return []

    @crops.setter
    def crops(self, value):
        self.crops_json = json.dumps(value)
