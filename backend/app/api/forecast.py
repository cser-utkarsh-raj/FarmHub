from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.forecast import ForecastRequest, ForecastResponse
from backend.app.services.forecast_engine import generate_price_forecast

router = APIRouter(tags=["ML Price Forecasting"])

@router.post("/forecast/price", response_model=ForecastResponse)
def get_price_forecast(payload: ForecastRequest):
    """
    Exposes the ML forecast contract for agricultural price forecasting in Bihar.
    Computes central estimate, confidence intervals (lower/upper bounds), and transparent limitations.
    """
    try:
        forecast = generate_price_forecast(payload)
        return forecast
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
