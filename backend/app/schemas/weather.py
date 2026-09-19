from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SprayAdvisory(BaseModel):
    status: str
    message: str
    color: str

class DayForecast(BaseModel):
    date: str
    temp_max_c: float
    temp_min_c: float
    rain_mm: float
    rain_prob_pct: float
    wind_speed_kmh: float
    spray_advisory: SprayAdvisory

class WeatherResponse(BaseModel):
    district: str
    latitude: float
    longitude: float
    current_temperature_c: float
    current_wind_speed_kmh: float
    today_spray_advisory: SprayAdvisory
    seven_day_forecast: List[DayForecast]
    source: str
    updated_at: str
