"""
Forecast Engine for FarmHub Bihar V1 Launch.

NOTE FOR MULTI-AGENT ARCHITECTURE:
This module is a temporary heuristic baseline / development placeholder.
It is explicitly non-ML / development-only.
Its purpose is solely to establish and verify the typed API contract (POST /forecast/price).
The Data/ML agent will replace this internal forecasting implementation once real data
and backtesting are available.
"""
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.app.services.crops_catalog import get_crop_by_name

class ForecastRequest(BaseModel):
    crop: str = Field(..., description="Crop/Commodity name (e.g. Maize, Wheat, Potato)")
    location: str = Field(..., description="District or Region in Bihar (e.g. Purnia, Patna)")
    market: str = Field(..., description="Target Mandi / Market (e.g. Gulabbagh, Gulzarbagh)")
    harvest_date: str = Field(..., description="Target date in YYYY-MM-DD format")

class ForecastResponse(BaseModel):
    central_estimate: float
    lower_bound: float
    upper_bound: float
    unit: str = "INR/quintal"
    forecast_date: str
    target_date: str
    model_version: str
    confidence: str  # HIGH, MODERATE, LOW
    limitations: List[str]

# Seasonal arrival adjustments by month for Bihar crops (ratio vs annual mean baseline)
# Month 1 = Jan, 12 = Dec
SEASONAL_FACTORS: Dict[str, Dict[int, float]] = {
    "Maize": {
        1: 1.05, 2: 1.04, 3: 0.98, 4: 0.92, 5: 0.90, 6: 0.95,
        7: 1.02, 8: 1.06, 9: 1.04, 10: 0.94, 11: 0.96, 12: 1.04
    },
    "Wheat": {
        1: 1.08, 2: 1.06, 3: 1.02, 4: 0.93, 5: 0.92, 6: 0.96,
        7: 1.00, 8: 1.03, 9: 1.05, 10: 1.07, 11: 1.08, 12: 1.09
    },
    "Paddy": {
        1: 0.94, 2: 0.96, 3: 1.00, 4: 1.02, 5: 1.04, 6: 1.06,
        7: 1.08, 8: 1.07, 9: 1.05, 10: 1.02, 11: 0.93, 12: 0.91
    },
    "Potato": {
        1: 0.95, 2: 0.85, 3: 0.82, 4: 0.90, 5: 1.00, 6: 1.10,
        7: 1.18, 8: 1.25, 9: 1.30, 10: 1.28, 11: 1.15, 12: 1.02
    },
    "Onion": {
        1: 1.08, 2: 1.05, 3: 1.02, 4: 0.92, 5: 0.88, 6: 0.94,
        7: 1.04, 8: 1.14, 9: 1.22, 10: 1.26, 11: 1.20, 12: 1.12
    },
    "Tomato": {
        1: 0.88, 2: 0.82, 3: 0.85, 4: 0.95, 5: 1.12, 6: 1.30,
        7: 1.45, 8: 1.35, 9: 1.20, 10: 1.05, 11: 0.95, 12: 0.90
    },
    "Mustard": {
        1: 1.06, 2: 0.98, 3: 0.92, 4: 0.90, 5: 0.95, 6: 1.00,
        7: 1.04, 8: 1.06, 9: 1.07, 10: 1.08, 11: 1.08, 12: 1.07
    },
    "Gram": {
        1: 1.05, 2: 1.03, 3: 0.94, 4: 0.91, 5: 0.95, 6: 1.00,
        7: 1.03, 8: 1.06, 9: 1.07, 10: 1.08, 11: 1.07, 12: 1.06
    },
    "Cauliflower": {
        1: 0.85, 2: 0.82, 3: 0.92, 4: 1.10, 5: 1.25, 6: 1.35,
        7: 1.40, 8: 1.30, 9: 1.15, 10: 1.05, 11: 0.92, 12: 0.88
    }
}

def generate_price_forecast(request: ForecastRequest) -> ForecastResponse:
    crop_data = get_crop_by_name(request.crop)
    if not crop_data:
        raise ValueError(f"Unknown crop '{request.crop}' for price forecast.")

    base_price = crop_data["benchmarks_per_acre"]["baseline_price_inr_quintal"]

    # Parse dates
    try:
        target_dt = datetime.strptime(request.harvest_date, "%Y-%m-%d").date()
    except ValueError:
        raise ValueError(f"Invalid harvest_date format: '{request.harvest_date}'. Must be YYYY-MM-DD.")

    today = date.today()
    days_ahead = (target_dt - today).days

    # Seasonal index based on target month
    crop_key = crop_data["name"]
    target_month = target_dt.month
    seasonal_mult = SEASONAL_FACTORS.get(crop_key, {}).get(target_month, 1.0)

    # Market location premium adjustments for primary trading mandis in Bihar
    market_adj = 1.0
    market_lower = request.market.lower()
    if "gulabbagh" in market_lower or "purnia" in market_lower:
        if crop_key == "Maize":
            market_adj = 1.03  # Premier trading hub liquidity premium
    elif "bihar sharif" in market_lower or "nalanda" in market_lower:
        if crop_key in ("Potato", "Onion"):
            market_adj = 1.02  # Vegetable belt liquidity
    elif "patna" in market_lower or "gulzarbagh" in market_lower:
        market_adj = 1.04      # Urban consumption center premium

    central_price = base_price * seasonal_mult * market_adj

    # Uncertainty bounds and confidence scoring based on forecast horizon
    if days_ahead <= 30:
        confidence = "HIGH"
        spread_pct = 0.06  # ±6%
    elif days_ahead <= 90:
        confidence = "MODERATE"
        spread_pct = 0.11  # ±11%
    else:
        confidence = "LOW"
        spread_pct = 0.18  # ±18%

    lower_price = central_price * (1.0 - spread_pct)
    upper_price = central_price * (1.0 + spread_pct)

    # Contextual agro-climatic and market limitations
    limitations: List[str] = [
        "Development placeholder: This forecast is generated using seasonal baseline heuristics for API integration testing and is NOT an ML-trained prediction. The Data/ML team will replace this with validated models.",
        f"Forecast reflects typical historical seasonal arrival curve in Bihar Mandis (target month: {target_dt.strftime('%B')}).",
        "Assumes absence of extreme unseasonal rainfall or cyclone events during harvest/drying window.",
    ]

    if crop_data["category"] in ("Vegetable", "Vegetable / Tuber"):
        limitations.append("Perishable commodity: prices are highly sensitive to local cold-storage space availability and daily arrivals.")
    if days_ahead > 60:
        limitations.append("Horizon exceeds 60 days: wider band accounts for potential changes in inter-state freight and trade policy.")
    if crop_key in ("Wheat", "Paddy"):
        limitations.append("Central estimate is anchored to prevailing Minimum Support Price (MSP) and local procurement activity.")

    return ForecastResponse(
        central_estimate=round(central_price, 2),
        lower_bound=round(lower_price, 2),
        upper_bound=round(upper_price, 2),
        unit="INR/quintal",
        forecast_date=today.isoformat(),
        target_date=target_dt.isoformat(),
        model_version="v0.1.0-dev-heuristic-placeholder",
        confidence=confidence,
        limitations=limitations
    )
