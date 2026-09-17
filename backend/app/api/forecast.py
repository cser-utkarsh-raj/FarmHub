from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.forecast import ForecastRequest, ForecastResponse
from backend.app.services.forecast_engine import generate_price_forecast

router = APIRouter(tags=["Forecast API Contract (Data/ML Integration)"])

@router.post("/forecast/price", response_model=ForecastResponse)
def get_price_forecast(payload: ForecastRequest):
    """
    Exposes the price forecast API contract for Bihar agricultural commodities.
    NOTE: The current implementation is a development-only heuristic placeholder.
    The Data/ML agent will provide the final statistical/ML forecasting model.
    """
    try:
        forecast = generate_price_forecast(payload)
        return forecast
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
