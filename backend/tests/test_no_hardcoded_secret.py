"""Regression test for credential hygiene."""
import re
from pathlib import Path


def test_data_gov_credential_is_environment_only():
    source = Path("backend/ml/scripts/data_ingestion.py").read_text(encoding="utf-8")
    assert 'os.getenv("DATA_GOV_IN_API_KEY")' in source
    assert '--api-key", default=None' in source
    # Reject accidental long hexadecimal credential literals in the ingestion script.
    assert not re.search(r"\b[0-9a-f]{40,}\b", source, flags=re.IGNORECASE)
