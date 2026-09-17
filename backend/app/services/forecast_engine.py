"""Production price forecast adapter.

FarmHub only reports an ML forecast when a trained artifact and sufficient
real Bihar mandi history are available. The previous hard-coded seasonal
heuristic is intentionally not used here.
"""
from __future__ import annotations
from datetime import date, datetime
from pathlib import Path
from typing import List
import pandas as pd
from fastapi import HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from backend.app.models.market_price import MandiRecord
from backend.ml.inference import ModelUnavailable, PriceInference

class ForecastRequest(BaseModel):
    crop: str = Field(..., min_length=1, description="Commodity name")
    location: str = Field(..., min_length=1, description="Bihar district")
    market: str = Field(..., min_length=1, description="Target mandi/market")
    harvest_date: str = Field(..., description="Target date in YYYY-MM-DD format")

class ForecastResponse(BaseModel):
    central_estimate: float
    lower_bound: float
    upper_bound: float
    unit: str = "INR/quintal"
    forecast_date: str
    target_date: str
    model_version: str
    confidence: str
    limitations: List[str]

def _confidence(central:float,lower:float,upper:float)->str:
    if central<=0: return "LOW"
    relative=((upper-lower)/2)/central
    if relative<=0.12: return "HIGH"
    if relative<=0.25: return "MODERATE"
    return "LOW"

def generate_price_forecast(request:ForecastRequest,db:Session)->ForecastResponse:
    try: target_dt=datetime.strptime(request.harvest_date,"%Y-%m-%d").date()
    except ValueError as exc: raise ValueError("Invalid harvest_date format. Must be YYYY-MM-DD.") from exc
    today=date.today()
    if target_dt<=today: raise ValueError("harvest_date must be a future date.")
    horizon=(target_dt-today).days
    if horizon>90: raise ValueError("FarmHub ML v1 supports forecast horizons up to 90 days. A longer horizon requires a separately validated model.")
    records=(db.query(MandiRecord).filter(MandiRecord.state.ilike("Bihar")).filter(MandiRecord.district.ilike(request.location)).filter(MandiRecord.market.ilike(request.market)).filter(MandiRecord.commodity.ilike(request.crop)).order_by(MandiRecord.record_date.asc()).all())
    if len(records)<30: raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,detail="Not enough verified Bihar mandi history is available for this crop/market. The forecast model requires at least 30 observations.")
    history=pd.DataFrame([{"state":r.state,"district":r.district,"market":r.market,"commodity":r.commodity,"variety":r.variety or "UNKNOWN","grade":"UNKNOWN","date":r.record_date,"min_price":r.min_price,"max_price":r.max_price,"modal_price":r.modal_price} for r in records])
    artifact_path=Path(__file__).resolve().parents[2]/"ml"/"models"/"price_forecaster.joblib"
    try: predictor=PriceInference(artifact_path)
    except ModelUnavailable as exc: raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,detail=str(exc)) from exc
    prediction=predictor.predict(history,request.crop,request.location,request.market,target_dt)
    limitations=["Prediction is based on historical Bihar mandi observations and is not a guaranteed farm-gate price.",f"Model trained through {prediction['trained_until']} and calibrated using held-out historical residuals.",f"The requested {horizon}-day horizon uses the nearest validated model horizon ({prediction['calibration_horizon']} days).","Weather shocks, policy changes, arrivals, storage constraints and transport disruptions can move prices beyond the historical range."]
    return ForecastResponse(central_estimate=prediction["central_estimate"],lower_bound=prediction["lower_bound"],upper_bound=prediction["upper_bound"],unit="INR/quintal",forecast_date=today.isoformat(),target_date=target_dt.isoformat(),model_version=prediction["model_version"],confidence=_confidence(prediction["central_estimate"],prediction["lower_bound"],prediction["upper_bound"]),limitations=limitations)
