from fastapi import APIRouter
from backend.app.api.auth import router as auth_router
from backend.app.api.crops import router as crops_router
from backend.app.api.economics import router as economics_router
from backend.app.api.forecast import router as forecast_router
from backend.app.api.market import router as market_router
from backend.app.api.buyers import router as buyers_router
from backend.app.api.weather import router as weather_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(crops_router)
api_router.include_router(economics_router)
api_router.include_router(forecast_router)
api_router.include_router(market_router)
api_router.include_router(buyers_router)
api_router.include_router(weather_router)

__all__ = ["api_router"]
