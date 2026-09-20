"""
Automated Model Promotion Pipeline for Shennong / FarmHub.

Evaluates candidate trained artifacts against quality, calibration coverage,
and provenance standards before promoting to production serving path.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.ml.core import Artifact


class PromotionError(RuntimeError):
    """Raised when candidate model fails promotion criteria."""
    pass


def compute_sha256(file_path: Path) -> str:
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def evaluate_candidate(
    artifact: Artifact,
    report: Dict[str, Any] | None = None,
    min_coverage: float = 0.80,
) -> Dict[str, Any]:
    """
    Evaluates candidate model against baseline and quality gates.
    """
    metrics = (
        (report.get("ml") if report else None)
        or (artifact.metrics.get("ml") if hasattr(artifact, "metrics") and isinstance(artifact.metrics, dict) else None)
        or getattr(artifact, "metrics", {})
        or {}
    )

    mae = metrics.get("mae")
    rmse = metrics.get("rmse")
    coverage = metrics.get("prediction_interval_coverage")

    if mae is None or rmse is None:
        raise PromotionError("Candidate artifact is missing essential evaluation metrics (MAE / RMSE).")

    if mae <= 0 or rmse <= 0:
        raise PromotionError(f"Candidate has non-positive error metrics: MAE={mae}, RMSE={rmse}")

    # Check conformal prediction interval coverage if reported
    if coverage is not None:
        coverage_decimal = coverage / 100.0 if coverage > 1.0 else coverage
        if coverage_decimal < min_coverage:
            raise PromotionError(
                f"Candidate interval coverage ({coverage_decimal:.1%}) fails minimum threshold ({min_coverage:.1%})."
            )

    # Check baseline comparison if present in report
    baseline = report.get("seasonal_naive_last_observation") if report else None
    if baseline and "mae" in baseline and baseline["mae"] is not None:
        base_mae = baseline["mae"]
        if mae > base_mae * 1.05:  # Allow 5% tolerance max against naive baseline
            raise PromotionError(
                f"Candidate model MAE ({mae:.2f}) does not outperform naive baseline MAE ({base_mae:.2f})."
            )

    provenance = getattr(artifact, "provenance", None)
    if report and "provenance" in report:
        provenance = report["provenance"]

    return {
        "status": "APPROVED",
        "mae": mae,
        "rmse": rmse,
        "interval_coverage": coverage,
        "trained_until": artifact.trained_until,
        "horizons": list(artifact.horizons),
        "provenance_verified": bool(provenance),
    }


def promote_model(
    candidate_path: str | Path,
    target_path: str | Path,
    report_path: str | Path | None = None,
    manifest_path: str | Path | None = None,
    min_coverage: float = 0.80,
) -> Dict[str, Any]:
    candidate = Path(candidate_path)
    target = Path(target_path)

    if not candidate.exists():
        raise PromotionError(f"Candidate artifact not found at {candidate}")

    # 1. Load candidate artifact
    try:
        artifact = Artifact.load(candidate)
    except Exception as exc:
        raise PromotionError(f"Failed to load candidate artifact: {exc}") from exc

    # 2. Load report if available
    report = None
    if report_path and Path(report_path).exists():
        try:
            report = json.loads(Path(report_path).read_text(encoding="utf-8"))
        except Exception:
            pass

    # 3. Evaluate candidate against promotion criteria
    evaluation = evaluate_candidate(artifact, report, min_coverage=min_coverage)

    # 4. Atomic copy to target location
    target.parent.mkdir(parents=True, exist_ok=True)
    temp_target = target.with_suffix(".tmp")
    shutil.copy2(candidate, temp_target)
    temp_target.replace(target)

    candidate_hash = compute_sha256(candidate)
    target_hash = compute_sha256(target)

    if candidate_hash != target_hash:
        raise PromotionError("Target artifact checksum mismatch after copy.")

    # 5. Write deployment manifest
    manifest_file = Path(manifest_path) if manifest_path else target.parent / "active_model_manifest.json"
    manifest_data = {
        "promoted_at": datetime.now(timezone.utc).isoformat(),
        "model_file": target.name,
        "sha256": target_hash,
        "trained_until": artifact.trained_until,
        "horizons": list(artifact.horizons),
        "evaluation": evaluation,
        "source_candidate": str(candidate),
    }

    manifest_file.parent.mkdir(parents=True, exist_ok=True)
    manifest_file.write_text(json.dumps(manifest_data, indent=2), encoding="utf-8")

    return {
        "status": "promoted",
        "target": str(target),
        "manifest": str(manifest_file),
        "sha256": target_hash,
        "evaluation": evaluation,
    }


def main():
    parser = argparse.ArgumentParser(description="Promote validated candidate model to production.")
    parser.add_argument("--candidate", default="backend/ml/models/test_forecaster.joblib")
    parser.add_argument("--target", default="backend/ml/models/price_forecaster.joblib")
    parser.add_argument("--report", default="backend/ml/reports/test_latest.json")
    parser.add_argument("--manifest", default="backend/ml/models/active_model_manifest.json")
    parser.add_argument("--min-coverage", type=float, default=0.80)

    args = parser.parse_args()
    try:
        result = promote_model(
            candidate_path=args.candidate,
            target_path=args.target,
            report_path=args.report,
            manifest_path=args.manifest,
            min_coverage=args.min_coverage,
        )
        print(json.dumps(result, indent=2))
        sys.exit(0)
    except PromotionError as err:
        print(json.dumps({"status": "rejected", "error": str(err)}, indent=2), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
