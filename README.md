# SHENNONG

> Agricultural decision-support platform for Bihar, presented by `.dot`.

Shennong is a production-oriented agricultural decision-support system built for Bihar farmers, commercial buyers, and distributors. The underlying repository is maintained at `cser-utkarsh-raj/FarmHub` with strict architectural separation between application tiers.

---

## Brand & Identity

Shennong uses one canonical visual identity throughout the application.

- **Product:** Shennong
- **Parent brand:** `.dot`
- **Canonical logo:** `frontend/public/farm-icon.svg`
- **Shared application logo component:** `frontend/src/components/ShennongLogo.tsx`
- The same Shennong logo is used across the landing page, navigation, and internal application pages.
- The logo asset is also used by the PWA service worker/manifest as the application icon.

---

## Authentic User Roles

Shennong serves three key participants in the agricultural value chain:

1. **Farmer (`FARMER`)**: Operational farm dashboard, crop planning across Bihar agro-climatic zones, input cost economics, live Agmarknet mandi prices, ML harvest price forecasting, distance-adjusted net realization comparison, and direct buyer supply inquiries.
2. **Commercial Buyer (`BUYER`)**: Trading desk with incoming farmer supply inquiries, verified commercial network directory, and real-time mandi price benchmarking.
3. **Distributor (`DISTRIBUTOR`)**: Regional supply consolidation, multi-district logistics coordination, and merchant inquiry workflows.

---

## Core Capabilities

Shennong organizes the complete decision-making workflow:

- **Crop Planning & Agronomics**: Cultivar selection, sowing/harvest windows, duration benchmarks, and Bihar land-unit conversion (Bigha, Katha, Acre, Hectare).
- **Mandi Price Intelligence**: Live modal, minimum, and maximum prices reported from official Agmarknet mandi feeds across Bihar districts (Purnia, Patna, Nalanda, Muzaffarpur, Bhagalpur, etc.).
- **ML Price Forecasting**: Chronologically validated Histogram Gradient Boosting price model with conformal prediction intervals (90% coverage) and explicit limitation disclosures. No heuristic/fabricated fallback numbers.
- **Production Economics & Scenarios**: Input cost breakdowns (seeds, fertilizers, pesticides, irrigation, labor, machinery, packaging, mandi fees), break-even price analysis, and three scenario models (conservative, expected, high-price).
- **Mandi Comparison & Net Realization**: Objective comparison of selling destinations taking into account distance, freight rates (₹/km/qtl), and mandi transaction fees rather than headline price alone.
- **Commercial Partner Discovery**: Verified directory of grain merchants, aggregators, and processing mills with structured supply inquiries.
- **Weather & Field Advisories**: District weather conditions, 7-day outlooks, and practical spray/field advisories powered by Open-Meteo.

---

## Repository Architecture

```text
FarmHub/
├── frontend/                 # React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
│   ├── src/
│   │   ├── components/       # ShennongNavbar, ShennongLogo, DotFooter, UI primitives
│   │   ├── pages/            # RoleSelection, Onboarding, Dashboards, Market Intelligence
│   │   └── lib/              # API client and formatting utilities
│   ├── public/               # Canonical logo, vector icons, PWA manifest
│   └── package.json
│
├── backend/                  # Python + FastAPI + SQLAlchemy + Scikit-Learn
│   ├── app/
│   │   ├── api/              # REST routers (auth, crops, economics, market, forecast, buyers, weather)
│   │   ├── core/             # Configuration, database engine, security, rate limiting
│   │   ├── models/           # SQLAlchemy models (User, FarmerProfile, BuyerProfile, MandiRecord, CropInquiry)
│   │   └── services/         # Business logic & computation engines
│   ├── ml/                   # ML pipeline, training, validation, inference, provenance
│   ├── tests/                # Automated pytest suite (unit, API robustness, e2e integration)
│   ├── requirements.txt      # Production dependencies (FastAPI, psycopg2-binary, scikit-learn, etc.)
│   └── Dockerfile
│
├── render.yaml               # Infrastructure-as-Code for Render web service & daily mandi sync cron
└── README.md
```

---

## Running Locally

### 1. Backend

```bash
cd backend
python -m venv .venv
# On Windows:
.venv\\Scripts\\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Local Backend API:
- Interactive Docs (Swagger): `http://localhost:8000/docs`
- Alternative Docs (ReDoc): `http://localhost:8000/redoc`
- Health probe: `http://localhost:8000/health`
- Readiness probe: `http://localhost:8000/health/ready`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Local Frontend Application:
- Web: `http://localhost:5173`

---

## Automated Verification

Run frontend lint and production build:
```bash
cd frontend
npm run lint
npm run build
```

Run backend test suites:
```bash
python -m pytest backend/tests -v
python -m pytest backend/ml/tests -v
```

---

## Production Deployment

- **Database**: PostgreSQL with automatic schema compatibility and `DATABASE_URL` normalization (`postgres://` -> `postgresql://`).
- **Web Service**: Containerized FastAPI service on Render or Docker-compatible host (`render.yaml`).
- **Scheduled Sync**: Daily cron job executing official Data.gov.in mandi synchronization (`backend/scripts/sync_mandi.py`).
- **Parent Brand**: Presented by `.dot` ecosystem.

---

**SHENNONG · presented by `.dot`**
