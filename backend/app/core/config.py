import os
import secrets
import warnings
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "FarmHub API")
    API_V1_STR: str = os.getenv("API_V1_STR", "/api")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./farmhub.db")
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
    )

    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))

    OPEN_METEO_BASE_URL: str = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1")
    WEATHER_CACHE_TTL_SECONDS: int = int(os.getenv("WEATHER_CACHE_TTL_SECONDS", "3600"))

    DATA_GOV_IN_API_KEY: str = os.getenv("DATA_GOV_IN_API_KEY", "")
    DATA_GOV_IN_MANDI_RESOURCE_ID: str = os.getenv("DATA_GOV_IN_MANDI_RESOURCE_ID", "9ef84268-d588-465a-a308-a864a43d0070")
    DATA_GOV_IN_VARIETY_RESOURCE_ID: str = os.getenv("DATA_GOV_IN_VARIETY_RESOURCE_ID", "35985678-0d79-46b4-9ed6-6f13308a1d24")
    DATA_GOV_IN_RAINFALL_RESOURCE_ID: str = os.getenv("DATA_GOV_IN_RAINFALL_RESOURCE_ID", "6c05cd1b-ed59-40c2-bc31-e314f39c6971")
    DATA_GOV_IN_PRODUCTION_RESOURCE_ID: str = os.getenv("DATA_GOV_IN_PRODUCTION_RESOURCE_ID", "35be999b-0208-4354-b557-f6ca9a5355de")
    DATA_GOV_IN_RESOURCE_URL: str = os.getenv(
        "DATA_GOV_IN_RESOURCE_URL",
        "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070",
    )
    FARMHUB_ML_MODEL_PATH: str = os.getenv(
        "FARMHUB_ML_MODEL_PATH",
        "./backend/ml/models/price_forecaster.joblib",
    )

    # Separate server-to-server key for the raw mandi ingestion endpoint.
    # Keep it out of source control; unlike farmer authentication tokens this
    # key is intended for scheduled/backend data jobs only.
    MANDI_INGESTION_KEY: str = os.getenv("MANDI_INGESTION_KEY", "")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    def model_post_init(self, __context, /) -> None:
        if not self.SECRET_KEY:
            if self.ENVIRONMENT.lower() == "production":
                raise RuntimeError(
                    "SECRET_KEY is not set. Refusing to start in production without a token signing key."
                )
            self.SECRET_KEY = secrets.token_urlsafe(32)
            warnings.warn(
                "SECRET_KEY is not set; using a random per-process development key. "
                "Set SECRET_KEY in the environment to keep sessions across restarts.",
                stacklevel=2,
            )


settings = Settings()
