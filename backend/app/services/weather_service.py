"""
Weather Service for FarmHub Bihar V1.
Integrates Open-Meteo for Bihar agricultural coordinates with persistent database caching.
Provides agricultural spray condition advisories and prevents API key exposure to frontend.
"""
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import httpx
from sqlalchemy.orm import Session
from backend.app.models.weather_cache import WeatherCache
from backend.app.core.config import settings
from backend.app.core.logging import logger

BIHAR_DISTRICT_COORDINATES = {
    "Patna": {"lat": 25.5941, "lon": 85.1376},
    "Purnia": {"lat": 25.7771, "lon": 87.4753},
    "Muzaffarpur": {"lat": 26.1209, "lon": 85.3647},
    "Nalanda": {"lat": 25.1982, "lon": 85.5149},
    "Samastipur": {"lat": 25.8630, "lon": 85.7811},
    "Begusarai": {"lat": 25.4182, "lon": 86.1272},
    "Bhagalpur": {"lat": 25.2425, "lon": 86.9842},
    "Gaya": {"lat": 24.7914, "lon": 85.0002},
    "Rohtas": {"lat": 24.9500, "lon": 84.0300},
    "Vaishali": {"lat": 25.6858, "lon": 85.2146}
}

def get_agricultural_spray_advisory(precipitation_probability_max: float, wind_speed_max: float) -> Dict[str, Any]:
    """Generates agricultural spraying & irrigation advisory based on wind and precipitation."""
    if precipitation_probability_max > 60:
        return {
            "status": "POOR",
            "message": "Heavy rain likely. Avoid pesticide/fertilizer spraying as run-off risk is high. Delay irrigation.",
            "color": "red"
        }
    elif precipitation_probability_max > 30 or wind_speed_max > 22:
        return {
            "status": "MODERATE",
            "message": "Moderate wind or shower risk. Spray only early morning with drift-reducing nozzles.",
            "color": "amber"
        }
    else:
        return {
            "status": "EXCELLENT",
            "message": "Clear conditions with calm winds. Ideal for foliar spray and field harvesting.",
            "color": "green"
        }

async def fetch_weather_for_district(db: Session, district_name: str) -> Dict[str, Any]:
    # Normalize district
    matched_district = None
    for d in BIHAR_DISTRICT_COORDINATES:
        if d.lower() in district_name.lower() or district_name.lower() in d.lower():
            matched_district = d
            break
    if not matched_district:
        matched_district = "Patna"

    coords = BIHAR_DISTRICT_COORDINATES[matched_district]
    now_utc = datetime.now(timezone.utc)

    # 1. Check database cache
    cached = db.query(WeatherCache).filter(WeatherCache.district == matched_district).first()
    if cached and cached.expires_at > now_utc:
        try:
            return json.loads(cached.payload_json)
        except Exception:
            pass

    # 2. Fetch fresh weather from Open-Meteo
    url = f"{settings.OPEN_METEO_BASE_URL}/forecast"
    params = {
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
        "current_weather": "true",
        "timezone": "Asia/Kolkata"
    }

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                raw_data = resp.json()
                daily = raw_data.get("daily", {})
                current = raw_data.get("current_weather", {})

                # Build 7-day forecast cards
                dates = daily.get("time", [])
                max_temps = daily.get("temperature_2m_max", [])
                min_temps = daily.get("temperature_2m_min", [])
                precip_sums = daily.get("precipitation_sum", [])
                precip_probs = daily.get("precipitation_probability_max", [])
                wind_speeds = daily.get("wind_speed_10m_max", [])

                days_forecast = []
                for i in range(min(len(dates), 7)):
                    p_prob = precip_probs[i] if i < len(precip_probs) else 10.0
                    w_spd = wind_speeds[i] if i < len(wind_speeds) else 12.0
                    days_forecast.append({
                        "date": dates[i],
                        "temp_max_c": max_temps[i] if i < len(max_temps) else 32.0,
                        "temp_min_c": min_temps[i] if i < len(min_temps) else 22.0,
                        "rain_mm": precip_sums[i] if i < len(precip_sums) else 0.0,
                        "rain_prob_pct": p_prob,
                        "wind_speed_kmh": w_spd,
                        "spray_advisory": get_agricultural_spray_advisory(p_prob, w_spd)
                    })

                today_rain_prob = precip_probs[0] if precip_probs else 10.0
                today_wind = wind_speeds[0] if wind_speeds else 10.0

                result = {
                    "district": matched_district,
                    "latitude": coords["lat"],
                    "longitude": coords["lon"],
                    "current_temperature_c": current.get("temperature", 29.5),
                    "current_wind_speed_kmh": current.get("windspeed", 8.0),
                    "today_spray_advisory": get_agricultural_spray_advisory(today_rain_prob, today_wind),
                    "seven_day_forecast": days_forecast,
                    "source": "Open-Meteo Agro-Climatology",
                    "updated_at": now_utc.isoformat()
                }

                # Save or update cache in DB
                expires = now_utc + timedelta(seconds=settings.WEATHER_CACHE_TTL_SECONDS)
                payload_str = json.dumps(result)
                if cached:
                    cached.payload_json = payload_str
                    cached.cached_at = now_utc
                    cached.expires_at = expires
                else:
                    db.add(WeatherCache(
                        district=matched_district,
                        latitude=coords["lat"],
                        longitude=coords["lon"],
                        payload_json=payload_str,
                        cached_at=now_utc,
                        expires_at=expires
                    ))
                db.commit()
                return result

    except Exception as e:
        logger.warning(f"Failed to fetch live weather for {matched_district}: {str(e)}. Falling back.")

    # 3. Fallback: if cached payload exists, return even if expired
    if cached:
        try:
            fallback = json.loads(cached.payload_json)
            fallback["note"] = "Cached historical reading (network retry pending)"
            return fallback
        except Exception:
            pass

    # 4. Climatological regional baseline for Bihar
    today_iso = datetime.now().strftime("%Y-%m-%d")
    return {
        "district": matched_district,
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "current_temperature_c": 30.0,
        "current_wind_speed_kmh": 10.0,
        "today_spray_advisory": {
            "status": "MODERATE",
            "message": "Typical seasonal Bihar humidity. Monitor field for moisture and spray in low-wind morning hours.",
            "color": "amber"
        },
        "seven_day_forecast": [
            {
                "date": today_iso,
                "temp_max_c": 33.0,
                "temp_min_c": 24.0,
                "rain_mm": 1.0,
                "rain_prob_pct": 20.0,
                "wind_speed_kmh": 10.0,
                "spray_advisory": {"status": "GOOD", "message": "Normal agricultural spray conditions.", "color": "green"}
            }
        ],
        "source": "Bihar Climatological Baseline",
        "updated_at": now_utc.isoformat()
    }
