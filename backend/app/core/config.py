import os
from typing import List
from pydantic import BaseModel

class Settings(BaseModel):
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "FarmHub API")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./farmhub.db")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")

    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))

    OPEN_METEO_BASE_URL: str = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1")
    WEATHER_CACHE_TTL_SECONDS: int = int(os.getenv("WEATHER_CACHE_TTL_SECONDS", "3600"))

    DATA_GOV_IN_API_KEY: str = os.getenv("DATA_GOV_IN_API_KEY", "")
    DATA_GOV_IN_RESOURCE_URL: str = os.getenv("DATA_GOV_IN_RESOURCE_URL", "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070")
    FARMHUB_ML_MODEL_PATH: str = os.getenv("FARMHUB_ML_MODEL_PATH", "./backend/ml/models/price_forecaster.joblib")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
