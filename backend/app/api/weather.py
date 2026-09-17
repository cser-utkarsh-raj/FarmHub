from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.weather import WeatherResponse
from backend.app.services.weather_service import fetch_weather_for_district

router = APIRouter(prefix="/weather", tags=["Agricultural Weather & Spray Advisory"])

@router.get("/{district}", response_model=WeatherResponse)
async def get_district_weather(
    district: str = Path(..., description="District in Bihar (e.g. Patna, Purnia, Muzaffarpur)"),
    db: Session = Depends(get_db)
):
    """
    Returns agricultural weather signals for the district: temperature, rain risk,
    wind speed, and spray advisory. Uses Open-Meteo with server-side database caching.
    """
    data = await fetch_weather_for_district(db, district)
    return data
