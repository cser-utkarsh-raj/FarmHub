from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base, SessionLocal, ensure_schema_compatibility
from backend.app.core.logging import logger
from backend.app.core.ratelimit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from backend.app.api import api_router
from backend.app.api.forecast import router as direct_forecast_router
from backend.app.seed.seed_data import seed_database
from sqlalchemy import text

# Ensure database tables exist immediately on import
Base.metadata.create_all(bind=engine)
ensure_schema_compatibility()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing FarmHub database tables and seed data...")
    Base.metadata.create_all(bind=engine)
    ensure_schema_compatibility()
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
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
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
        "service": "Shennong Backend",
        "region_scope": "Bihar, India",
        "presented_by": ".dot"
    }

@app.get("/health/ready", tags=["Health & Monitoring"])
def readiness_check():
    """Readiness probe: verify the application can reach its configured database."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:
        logger.error("Readiness check failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connectivity check failed.",
        ) from exc
    return {"status": "ready", "service": "Shennong Backend"}


@app.get("/", tags=["Health & Monitoring"])
def root():
    return {
        "message": "Welcome to Shennong API presented by .dot",
        "docs_url": "/docs",
        "region_scope": "Bihar, India",
        "supported_crops": ["Maize", "Wheat", "Paddy", "Potato", "Onion", "Tomato", "Mustard", "Gram", "Cauliflower"]
    }
