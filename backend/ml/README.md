# FarmHub ML

Production-oriented Bihar mandi price forecasting pipeline. The training source is the official data.gov.in **Current Daily Price of Various Commodities from Various Markets (Mandi)** resource generated through AGMARKNET.

## Implemented
- Paginated Bihar ingestion using an environment-provided API key.
- Schema/field alias normalization and safe numeric/date parsing.
- Duplicate removal and impossible-price filtering without global percentile deletion.
- Leakage-safe per-series lags and rolling statistics; current target is never included in its own rolling feature.
- Direct 7/30/90-day supervised examples using only information available at the forecast origin.
- Chronological train/calibration/test split.
- Gradient-boosted regression with unknown-category handling.
- Last-observation baseline comparison.
- Held-out absolute-residual calibration for prediction intervals.
- Rolling-origin backtesting.
- Serialized model artifact for backend inference.

## Run

```bash
set DATA_GOV_IN_API_KEY=YOUR_KEY
python backend/ml/scripts/data_ingestion.py --commodity Potato --commodity Wheat
python backend/ml/scripts/train.py
python backend/ml/scripts/backtest.py
python -m pytest backend/ml/tests -q
```

Generated datasets, reports and model artifacts are gitignored. **No fabricated training dataset is included.**

The backend forecast endpoint refuses to claim an ML prediction until a trained artifact is installed and sufficient verified Bihar market history exists.

Source: https://data.gov.in/resource/current-daily-price-various-commodities-from-various-markets-mandi
