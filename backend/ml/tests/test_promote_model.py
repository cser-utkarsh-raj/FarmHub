import json
from pathlib import Path
import pytest
from backend.ml.core import Artifact
from backend.ml.scripts.promote_model import evaluate_candidate, promote_model, PromotionError

def test_evaluate_candidate_success():
    class DummyArtifact:
        trained_until = "2026-09-18"
        horizons = [7, 15, 30]
        metrics = {
            "ml": {
                "mae": 150.0,
                "rmse": 200.0,
                "prediction_interval_coverage": 92.5,
            }
        }
        provenance = {"resource_id": "test"}

    result = evaluate_candidate(DummyArtifact())
    assert result["status"] == "APPROVED"
    assert result["mae"] == 150.0
    assert result["rmse"] == 200.0


def test_evaluate_candidate_fails_low_coverage():
    class DummyArtifact:
        trained_until = "2026-09-18"
        horizons = [7, 15, 30]
        metrics = {
            "ml": {
                "mae": 150.0,
                "rmse": 200.0,
                "prediction_interval_coverage": 65.0,  # Below 80%
            }
        }
        provenance = {}

    with pytest.raises(PromotionError, match="fails minimum threshold"):
        evaluate_candidate(DummyArtifact(), min_coverage=0.80)


def test_promote_model_roundtrip(tmp_path):
    candidate = Path("backend/ml/models/test_forecaster.joblib")
    report = Path("backend/ml/reports/test_latest.json")
    if not candidate.exists():
        pytest.skip("Test forecaster candidate not present")

    target = tmp_path / "served_model.joblib"
    manifest = tmp_path / "manifest.json"

    result = promote_model(
        candidate_path=candidate,
        target_path=target,
        report_path=report,
        manifest_path=manifest,
        min_coverage=0.80,
    )

    assert result["status"] == "promoted"
    assert target.exists()
    assert manifest.exists()

    manifest_data = json.loads(manifest.read_text(encoding="utf-8"))
    assert manifest_data["model_file"] == "served_model.joblib"
    assert manifest_data["sha256"] == result["sha256"]
