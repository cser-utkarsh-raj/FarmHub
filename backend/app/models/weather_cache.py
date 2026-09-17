from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from backend.app.core.database import Base

class WeatherCache(Base):
    __tablename__ = "weather_cache"

    id = Column(Integer, primary_key=True, index=True)
    district = Column(String(100), unique=True, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    payload_json = Column(Text, nullable=False)
    cached_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)
