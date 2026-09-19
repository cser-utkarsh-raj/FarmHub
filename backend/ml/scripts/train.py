from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import numpy as np
import pandas as pd

from backend.ml.core import Artifact, FEATURES, HORIZONS, build_supervised, clean_market_data, make_baseline, make_model, metrics
from backend.ml.provenance import verify_provenance

MARKET_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"


def conformal_q(residuals: np.ndarray, coverage: float = 0.90) -> float:
    residuals = np.asarray(residuals, dtype=float)
    residuals = residuals[np.isfinite(residuals)]
    if len(residuals) < 30:
        raise RuntimeError("Not enough calibration residuals for a reliable prediction interval")
    return float(np.quantile(residuals, coverage, method="higher"))


def train(raw_path: str, artifact_path: str, report_path: str, provenance_path: str) -> dict:
    provenance = verify_provenance(raw_path, provenance_path, expected_resource_id=MARKET_RESOURCE_ID)
    raw = pd.read_csv(raw_path)
    if int(provenance.row_count) != len(raw):
        raise RuntimeError(f"Provenance row count {provenance.row_count} does not match input rows {len(raw)}")

    clean = clean_market_data(raw)
    supervised = build_supervised(clean, HORIZONS)
    if supervised.empty or len(supervised) < 500:
        raise RuntimeError(f"Insufficient supervised observations from verified data: {len(supervised)}")

    supervised = supervised.sort_values("target_date").reset_index(drop=True)
    dates = supervised.target_date.drop_duplicates().sort_values()
    train_cut = dates.iloc[int(len(dates) * 0.65)]
    calibration_cut = dates.iloc[int(len(dates) * 0.80)]

    train_df = supervised[supervised.target_date < train_cut].copy()
    calibration_df = supervised[(supervised.target_date >= train_cut) & (supervised.target_date < calibration_cut)].copy()
    test_df = supervised[supervised.target_date >= calibration_cut].copy()
    if min(len(train_df), len(calibration_df), len(test_df)) < 30:
        raise RuntimeError("Chronological train/calibration/test split is too small")

    model = make_model()
    model.fit(train_df[FEATURES], train_df.target_price)

    cal_pred = model.predict(calibration_df[FEATURES])
    calibration_df["abs_residual"] = np.abs(calibration_df.target_price.to_numpy() - cal_pred)

    intervals = {}
    for horizon in HORIZONS:
        low = max(1, horizon - 2)
        high = horizon + max(2, int(horizon * 0.08))
        residuals = calibration_df.loc[calibration_df.horizon_days.between(low, high), "abs_residual"].to_numpy()
        if len(residuals) < 30:
            residuals = calibration_df.abs_residual.to_numpy()
        intervals[str(horizon)] = conformal_q(residuals)

    pred = model.predict(test_df[FEATURES])
    test_df["prediction"] = pred
    test_df["interval_q90"] = test_df.horizon_days.map(lambda h: intervals[str(min(HORIZONS, key=lambda x: abs(x - int(h))))])
    test_df["lower"] = np.maximum(0, test_df.prediction - test_df.interval_q90)
    test_df["upper"] = test_df.prediction + test_df.interval_q90

    ml_metrics = metrics(test_df.target_price.to_numpy(), pred)
    ml_metrics["prediction_interval_coverage"] = float(((test_df.target_price >= test_df.lower) & (test_df.target_price <= test_df.upper)).mean() * 100)

    baseline = make_baseline(train_df, test_df)
    valid = np.isfinite(baseline)
    baseline_metrics = metrics(test_df.loc[valid, "target_price"].to_numpy(), baseline[valid]) if valid.any() else {}

    report = {
        "model_version": "farmhub-global-hgb-v2",
        "trained_until": str(train_df.target_date.max().date()),
        "calibration_from": str(calibration_df.target_date.min().date()),
        "test_from": str(test_df.target_date.min().date()),
        "train_rows": len(train_df),
        "calibration_rows": len(calibration_df),
        "test_rows": len(test_df),
        "series": int(clean.groupby(["district", "market", "commodity", "variety"]).ngroups),
        "ml": ml_metrics,
        "seasonal_naive_last_observation": baseline_metrics,
        "conformal_q90_by_horizon": intervals,
        "provenance": provenance.to_dict(),
    }

    Artifact(model=model, feature_columns=FEATURES, trained_until=report["trained_until"], horizons=list(HORIZONS), metrics=report, provenance=provenance.to_dict()).save(artifact_path)
    Path(report_path).parent.mkdir(parents=True, exist_ok=True)
    Path(report_path).write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="backend/ml/data/raw/bihar_market_prices.csv")
    parser.add_argument("--provenance", default="backend/ml/data/provenance/mandi.json")
    parser.add_argument("--artifact", default="backend/ml/models/price_forecaster.joblib")
    parser.add_argument("--report", default="backend/ml/reports/latest.json")
    args = parser.parse_args()
    print(json.dumps(train(args.input, args.artifact, args.report, args.provenance), indent=2))


if __name__ == "__main__":
    main()
