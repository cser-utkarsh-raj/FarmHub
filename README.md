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

FarmHub currently uses four official Data.gov.in resources:

| Resource | FarmHub purpose |
|---|---|
| Mandi daily prices | Market history, comparison and price forecasting |
| Variety-wise prices | Variety-level market signals |
| Daily district rainfall | Rainfall history and weather-linked features |
| District/season/crop production | Historical production and future yield modeling |

All four use one `DATA_GOV_IN_API_KEY` environment secret. Public resource IDs are stored in the ML provider layer; they are not credentials.

The ML price pipeline requires fresh fetched data, provenance metadata, file-digest verification, chronological validation and baseline comparison. Synthetic demo market records are excluded from ML inference.

## Privacy and verification

FarmHub should not store raw Aadhaar numbers. Verification is represented through verification status/appropriate external verification mechanisms rather than retaining unnecessary identity documents.

Secrets, passwords, JWT keys, ingestion keys and API credentials must remain outside source control.

### Data.gov.in API key placement

FarmHub's ML ingestion has the public Data.gov.in sample/demo key as a development fallback so a fresh checkout can exercise the request path. It is limited by Data.gov.in and is not suitable for training a production model. The real key belongs only in runtime secrets:

- **Local:** set `DATA_GOV_IN_API_KEY` in the PowerShell/Linux environment (or an untracked `.env` loaded by your local environment).
- **GitHub Actions:** repository `Settings → Secrets and variables → Actions → New repository secret` named `DATA_GOV_IN_API_KEY`.
- **Render/deployment:** add `DATA_GOV_IN_API_KEY` as a private environment variable on the backend service.
- **Never:** frontend/Vite env exposed to the browser, README, source code, or committed `.env` files.

The official mandi resource currently exposes state/commodity filters and the sample key is explicitly intended for demonstration; serious data pulls need a personal key. citeturn951075search8turn218014search10

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