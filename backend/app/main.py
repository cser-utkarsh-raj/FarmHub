from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal
from backend.app.core.logging import logger
from backend.app.api import api_router
from backend.app.api.forecast import router as direct_forecast_router
from backend.app.seed.seed_data import seed_database

# Ensure database tables exist immediately on import
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing FarmHub database tables and seed data...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    logger.info("FarmHub backend initialized successfully.")
    yield
    logger.info("Shutting down FarmHub backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-oriented Agricultural Decision-Support Platform presented by .dot. Scope: Bihar, India.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint alias for ML Forecast contract (POST /forecast/price)
app.include_router(direct_forecast_router)

# Mount API V1 router under /api
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health & Monitoring"])
def health_check():
    return {
        "status": "healthy",
        "service": "FarmHub Backend",
        "region_scope": "Bihar, India",
        "presented_by": ".dot"
    }

@app.get("/", tags=["Health & Monitoring"])
def root():
    return {
        "message": "Welcome to FarmHub API presented by .dot",
        "docs_url": "/docs",
        "region_scope": "Bihar, India",
        "supported_crops": ["Maize", "Wheat", "Paddy", "Potato", "Onion", "Tomato", "Mustard", "Gram", "Cauliflower"]
    }
