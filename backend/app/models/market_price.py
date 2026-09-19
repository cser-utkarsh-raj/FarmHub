from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, Index, Boolean, true
from backend.app.core.database import Base

class MandiRecord(Base):
    __tablename__ = "mandi_records"

    id = Column(Integer, primary_key=True, index=True)
    market = Column(String(100), nullable=False, index=True)  # e.g. Gulabbagh, Patna, Bihar Sharif
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), default="Bihar", nullable=False)

    commodity = Column(String(100), nullable=False, index=True)  # e.g. Maize, Wheat, Potato, Onion
    variety = Column(String(100), default="Standard")

    min_price = Column(Float, nullable=False)    # in INR / quintal
    max_price = Column(Float, nullable=False)    # in INR / quintal
    modal_price = Column(Float, nullable=False)  # in INR / quintal

    arrivals_volume = Column(Float, default=0.0) # in quintals or metric tonnes
    unit = Column(String(20), default="INR/quintal", nullable=False)

    record_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    # Unknown/legacy rows default to synthetic until verified ingestion marks them false.
    is_synthetic = Column(Boolean, default=True, server_default=true(), nullable=False, index=True)

    __table_args__ = (
        Index("idx_market_crop_date", "market", "commodity", "record_date"),
        Index("idx_district_crop_date", "district", "commodity", "record_date"),
    )
