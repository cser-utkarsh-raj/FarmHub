"""TEST FIXTURES for forecast horizon semantics."""
import joblib

from backend.ml.core import Artifact
from backend.ml.inference import PriceInference


def test_45_day_interval_is_not_validated(tmp_path):
    artifact = Artifact(
        model=None,
        feature_columns=[],
        trained_until="2026-09-18",
        horizons=[7, 30, 90],
        metrics={"conformal_q90_by_horizon": {"7": 100, "30": 150, "90": 300}},
    )
    path = tmp_path / "model.joblib"
    joblib.dump(artifact, path)

    predictor = PriceInference(path)
    nearest, validated = predictor._horizon_calibration(45)
    assert nearest == 30
    assert validated is False
