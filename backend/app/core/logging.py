import logging
import sys
import re

class SensitiveDataFilter(logging.Filter):
    """
    Sanitizes log records to ensure no raw passwords, tokens, or PII are written to logs.
    """
    SENSITIVE_PATTERNS = [
        re.compile(r'(password["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', re.IGNORECASE),
        re.compile(r'(authorization["\']?\s*[:=]\s*["\']Bearer\s+)([^"\']+)(["\'])', re.IGNORECASE),
        re.compile(r'(token["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', re.IGNORECASE),
        re.compile(r'(secret["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', re.IGNORECASE),
    ]

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            msg = record.msg
            for pattern in self.SENSITIVE_PATTERNS:
                msg = pattern.sub(r'\1***REDACTED***\3', msg)
            record.msg = msg
        return True

def setup_logging():
    logger = logging.getLogger("farmhub")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        handler.addFilter(SensitiveDataFilter())
        logger.addHandler(handler)

    return logger

logger = setup_logging()
