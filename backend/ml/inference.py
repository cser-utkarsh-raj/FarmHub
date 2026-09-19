from __future__ import annotations

from datetime import date
from pathlib import Path

import pandas as pd

from backend.ml.core import Artifact, FEATURES, add_features, clean_market_data

DEFAULT_ARTIFACT = Path(__file__).resolve().parent / "models" / "price_forecaster.joblib"


class ModelUnavailable(RuntimeError):
    pass


class PriceInference:
    def __init__(self, artifact_path: str | Path = DEFAULT_ARTIFACT):
        self.path = Path(artifact_path)
        if not self.path.exists():
            raise ModelUnavailable(
                "No trained FarmHub price model is installed. "
                "Run the verified data ingestion and training pipeline first."
            )
        self.artifact = Artifact.load(self.path)

    def _horizon_calibration(self, horizon: int) -> tuple[int, bool]:
        horizons = tuple(self.artifact.horizons)
        if not horizons:
            raise ModelUnavailable("Installed FarmHub model has no validated horizons")
        nearest = min(horizons, key=lambda value: abs(value - horizon))
        validated = abs(nearest - horizon) <= max(1, int(nearest * 0.10))
        return nearest, validated

    def predict(
        self,
        history: pd.DataFrame,
        crop: str,
        district: str,
        market: str,
        target_date: date,
    ) -> dict:
        clean = clean_market_data(history)
        series = clean[
            (clean.commodity.str.casefold() == crop.casefold())
            & (clean.district.str.casefold() == district.casefold())
            & (clean.market.str.casefold() == market.casefold())
        ]
        if series.empty:
            raise ValueError(
                "No historical observations for the requested crop, district and market."
            )

        latest = series.date.max().date()
        horizon = (target_date - latest).days
        if horizon <= 0:
            raise ValueError(
                "Target harvest date must be after the latest market observation."
            )

        rowset = add_features(series).tail(1).copy()
        target = pd.Timestamp(target_date)
        rowset["horizon_days"] = horizon
        rowset["target_month"] = target.month
        rowset["target_week_of_year"] = int(target.isocalendar().week)
        rowset["target_day_of_year"] = target.dayofyear

        prediction = float(self.artifact.model.predict(rowset[FEATURES])[0])
        qmap = self.artifact.metrics.get("conformal_q90_by_horizon", {})
        nearest, interval_validated = self._horizon_calibration(horizon)
        spread = float(qmap.get(str(nearest), 0.0))

        return {
            "central_estimate": round(max(0.0, prediction), 2),
            "lower_bound": round(max(0.0, prediction - spread), 2),
            "upper_bound": round(max(0.0, prediction + spread), 2),
            "horizon_days": horizon,
            "model_version": self.artifact.metrics.get(
                "model_version", "farmhub-global-hgb-v2"
            ),
            "trained_until": self.artifact.trained_until,
            "calibration_horizon": nearest,
            "interval_validated_for_requested_horizon": interval_validated,
        }
