# FarmHub ML

Production-oriented Bihar agricultural data and price-forecasting pipeline.

## Official Data.gov.in resources

FarmHub currently uses one `DATA_GOV_IN_API_KEY` with four official resources:

- Mandi daily prices: `9ef84268-d588-465a-a308-a864a43d0070`
- Variety-wise market prices: `35985678-0d79-46b4-9ed6-6f13308a1d24`
- Daily district rainfall: `6c05cd1b-ed59-40c2-bc31-e314f39c6971`
- District/season/crop production: `35be999b-0208-4354-b557-f6ca9a5355de`

Resource IDs are configuration, not credentials. The API credential is never stored in Git.

## Data foundation

Providers under `backend/ml/providers/` use the resource-specific filter names exposed by Data.gov.in, paginate by the number of records actually returned, retry transient failures, normalize market-price rows, and preserve source columns for rainfall and production datasets.

Every fetched file receives a provenance sidecar recording source, resource ID, fetch time, time range, coverage and a digest of the exact file bytes.

## ML safeguards

- Live fetch failures fail closed; stale snapshots are not silently reused.
- Training and backtesting require matching provenance metadata and resource IDs.
- The price model only trains from the official mandi resource.
- Synthetic application seed records are excluded from price inference.
- 7/30/90-day uncertainty intervals are not represented as calibrated for arbitrary horizons.

## Local verification

From the repository root in PowerShell:

```powershell
$env:DATA_GOV_IN_API_KEY="YOUR_KEY"

python backend/ml/scripts/data_ingestion.py --dataset mandi --commodity Maize --max-pages 200
python backend/ml/scripts/data_ingestion.py --dataset variety --commodity Maize --max-pages 200
python backend/ml/scripts/data_ingestion.py --dataset rainfall --max-pages 50
python backend/ml/scripts/data_ingestion.py --dataset production --max-pages 50

python -m pytest backend/ml/tests backend/tests -q
python backend/ml/scripts/train.py
python backend/ml/scripts/backtest.py
```

Generated data, provenance, reports and model artifacts remain gitignored.
