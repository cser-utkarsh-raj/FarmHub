"""Request rate limiting for security-sensitive endpoints."""
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.app.core.config import settings

limiter = Limiter(key_func=get_remote_address, headers_enabled=True)


def auth_rate_limit() -> str:
    """Resolve the configured authentication limit at request time."""
    return f"{settings.RATE_LIMIT_PER_MINUTE}/minute"
