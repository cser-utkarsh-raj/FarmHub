"""TEST FIXTURE checks for synthetic market seed isolation."""
from pathlib import Path

from backend.app.models.market_price import MandiRecord


def test_mandi_record_defaults_to_synthetic():
    assert MandiRecord.is_synthetic.default.arg is True


def test_demo_seed_marks_generated_rows_synthetic():
    source = Path("backend/app/seed/seed_data.py").read_text(encoding="utf-8")
    assert "is_synthetic=True" in source
