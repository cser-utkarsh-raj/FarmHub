# FarmHub

> Agricultural decision-support platform for Bihar, presented by `.dot`.

FarmHub is being built as a practical agricultural intelligence platform rather than a demo-only application. The first launch target is Bihar, with the architecture designed to support expansion later.

## What FarmHub is for

FarmHub brings the main decisions a farmer faces around a crop into one workflow:

- **Crop planning** — crop selection, sowing/harvest timing and land-unit handling.
- **Market intelligence** — current and historical mandi prices.
- **Price forecasting** — future price estimates for a planned harvest date, with uncertainty and limitations shown to the user.
- **Profitability** — production cost, expected yield, selling price, revenue, net profit, margin and ROI scenarios.
- **Market comparison** — compare markets using price plus estimated logistics/fees rather than headline price alone.
- **Buyer/distributor discovery** — find relevant local commercial contacts and submit supply inquiries.
- **Weather intelligence** — district weather and practical field/spray advisories.

## Repository architecture

The repository has a strict separation between application layers:

```text
FarmHub/
├── frontend/                 # React + TypeScript web application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/                  # FastAPI + database + business logic
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── API_CONTRACTS.md
│
├── AI_RULES.md
├── README.md
└── project-level configuration/documentation
```

**Important:** frontend code belongs in `frontend/`. Backend/API code belongs in `backend/`. Agents must not create a second application at the repository root or overwrite another agent's area.

## Frontend

The frontend is a Vite application using:

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Responsive, mobile-first UI

Current product surfaces include role selection, farmer onboarding, crop selection/planning, price intelligence, profitability, market comparison, buyer discovery and dashboard navigation.

The frontend is being progressively connected to the real backend; existing UI mock data should not be mistaken for production market data.

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

The backend provides:

- JWT authentication and role-based access
- Farmer, distributor and buyer profiles
- Bihar land-unit conversion support
- Crop catalogue and agronomic/economic baselines
- Market price ingestion and querying
- Price forecast API contract
- Profitability/scenario calculations
- Distance-adjusted market comparison
- Buyer directory and inquiries
- Weather integration and advisories
- Automated backend tests

### Run backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Local API:

- `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Backend API surface

The authoritative integration contract is [`backend/API_CONTRACTS.md`](backend/API_CONTRACTS.md).

Key endpoints include:

| Area | Endpoint |
|---|---|
| Register | `POST /api/auth/register` |
| Login | `POST /api/auth/login` |
| Current profile | `GET /api/auth/me` |
| Crops | `GET /api/crops` |
| Economics | `POST /api/economics/calculate` |
| Current prices | `GET /api/market/prices/current` |
| Price history | `GET /api/market/prices/history` |
| Market comparison | `POST /api/market/compare` |
| Price forecast | `POST /api/forecast/price` |
| Buyers | `GET /api/buyers` |
| Buyer inquiry | `POST /api/buyers/{buyer_user_id}/inquire` |
| Inquiries | `GET /api/inquiries` |
| Weather | `GET /api/weather/{district}` |

Frontend integrations should follow the backend contract instead of inventing parallel endpoint names.

## Data and ML

FarmHub's price intelligence uses the official data.gov.in resource **9ef84268-d588-465a-a308-a864a43d0070**, the Government of India's current daily commodity/mandi price resource generated through AGMARKNET.

The ingestion pipeline:

1. Fetches Bihar observations with the resource's JSON GET API.
2. Handles API/key-level page-size limits without skipping records.
3. Normalizes commodity, market, variety, grade, date and price fields.
4. Removes invalid prices and duplicate observations.
5. Builds leakage-safe lag and rolling features per market/crop series.
6. Trains and backtests the forecasting model chronologically.
7. Produces held-out residual-based prediction intervals.

A model is only considered production intelligence when its:

1. data source is traceable,
2. training data is reproducible,
3. features avoid future-data leakage,
4. time-series validation/backtesting is performed,
5. error metrics are reported, and
6. uncertainty/prediction intervals are honestly represented.

Heuristic/demo forecasts must not be presented as trained ML models. A trained model artifact is deliberately not committed to Git; it must be generated from verified data and installed through the deployment pipeline.

## Privacy and verification

FarmHub should not store raw Aadhaar numbers. Verification is represented through verification status/appropriate external verification mechanisms rather than retaining unnecessary identity documents.

Secrets, passwords, JWT keys, ingestion keys and API credentials must remain outside source control.

## Agent development rules

FarmHub is developed as a shared codebase.

### Ownership

- **Frontend agent:** `frontend/`
- **Backend agent:** `backend/`
- **ML/data:** `backend/ml/`
- **Integration:** repository-level coordination and final validation

### Git workflow

For this repository, requested fixes and implementation work should be applied directly to `main` unless the user explicitly asks for a separate branch or PR.

Agents must inspect the current repository before changing anything. They must not initialize a new repository, create unrelated Git history, reset `main`, force-push, or replace another agent's work.

Every completed task should report:

- commit SHA,
- files changed,
- tests/build checks performed,
- API contracts changed (if any), and
- anything intentionally left untouched.

## Status

FarmHub is under active development. The backend foundation and executable ML pipeline are in place; real-data model training/deployment and frontend-to-backend integration remain active work.

---

**FarmHub · presented by `.dot`**
