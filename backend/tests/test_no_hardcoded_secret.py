"""Regression test for credential hygiene."""
import re
from pathlib import Path


def test_data_gov_real_credential_is_not_embedded():
    source = Path("backend/ml/scripts/data_ingestion.py").read_text(encoding="utf-8")
    assert "DEMO_API_KEY" in source
    assert 'os.getenv("DATA_GOV_IN_API_KEY")' in source
    assert '--api-key", default=None' in source

    demo_match = re.search(r'DEMO_API_KEY\s*=\s*["\']([^"\']+)["\']', source)
    assert demo_match, "public sample/demo key fallback is missing"
    demo_value = demo_match.group(1)
    assert len(demo_value) >= 40

    scrubbed = source.replace(demo_value, "")
    assert not re.search(r"\b[0-9a-f]{40,}\b", scrubbed, flags=re.IGNORECASE)
