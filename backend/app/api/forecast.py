from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.schemas.forecast import ForecastRequest, ForecastResponse
from backend.app.services.forecast_engine import generate_price_forecast

router=APIRouter(tags=["ML Price Forecasting"])

@router.post("/forecast/price",response_model=ForecastResponse)
def get_price_forecast(payload:ForecastRequest,db:Session=Depends(get_db)):
    try: return generate_price_forecast(payload,db)
    except ValueError as exc: raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail=str(exc)) from exc
