from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class CropInquiry(Base):
    __tablename__ = "crop_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    crop = Column(String(100), nullable=False)
    quantity_quintals = Column(Float, nullable=False)
    expected_harvest_date = Column(String(50), nullable=False)
    target_price_inr = Column(Float, nullable=True)  # Farmer's desired price per quintal
    notes = Column(Text, nullable=True)

    # Status: PENDING, ACCEPTED, DECLINED, CONTACTED
    status = Column(String(50), default="PENDING", nullable=False)
    buyer_response = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    farmer = relationship("User", foreign_keys=[farmer_id], back_populates="inquiries_sent")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="inquiries_received")
