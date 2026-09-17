<div align="center">

# 🌾 FarmHub

### Agricultural intelligence for better crop and market decisions.

<p>
  <img src="https://img.shields.io/badge/status-production--ready-16a34a?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/region-Bihar%20first-111111?style=for-the-badge" alt="Region" />
  <img src="https://img.shields.io/badge/forecasting-ML%20driven-111111?style=for-the-badge" alt="Forecasting" />
  <img src="https://img.shields.io/badge/tests-21%20passed-16a34a?style=for-the-badge" alt="Tests" />
</p>

> **Plan the crop. Understand the market. Estimate the economics. Find the buyer.**

[![FarmHub](https://raw.githubusercontent.com/cser-utkarsh-raj/FarmHub/main/assets/farmhub-banner.svg)](https://github.com/cser-utkarsh-raj/FarmHub)

</div>

---

## What is FarmHub?

FarmHub is a practical agricultural decision platform for farmers, distributors and buyers presented by `.dot`.

The first release focuses on **Bihar, India**, combining **market data, crop economics, weather signals, and price forecasting** into a single unified backend workflow:

```text
Location + Land (Bigha/Acre) + Crop + Planting Window
                    │
                    ▼
        Market & historical data
        Weather & seasonal signals (Open-Meteo)
        Crop cost / yield assumptions (ICAR / BAU Sabour)
                    │
                    ▼
          ┌───────────────────┐
          │   FARMHUB ENGINE  │
          └─────────┬─────────┘
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
   Price outlook  Economics   Market access
       │            │            │
       ▼            ▼            ▼
   Price range   Profit/Loss   Distance-adjusted
  (ML contract)   scenarios   net mandi realization
                 (Cons/Exp/High) & verified buyers
```

---

## Repository Structure

```text
FarmHub/
├── backend/
│   ├── app/
│   │   ├── api/             # Routers (Auth, Crops, Economics, Forecast, Market, Buyers, Weather)
│   │   ├── core/            # Config, Security (bcrypt/JWT), DB session, Sanitized logging
│   │   ├── models/          # SQLAlchemy Models (User, Profiles, MandiRecord, Inquiries, WeatherCache)
│   │   ├── schemas/         # Pydantic Schemas & typed request/response contracts
│   │   ├── services/        # Domain engines (Economics, Forecast, Market comparator, Ingestion)
│   │   ├── seed/            # Historical Bihar mandi data & verified buyer seeders
│   │   └── main.py          # FastAPI application factory & lifespan
│   ├── tests/               # Pytest suite (21 unit & integration tests)
│   ├── API_CONTRACTS.md     # Typed API contracts for Frontend & ML integration
│   ├── Dockerfile           # Production container build
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Backend environment configuration template
├── frontend/                # Web application / PWA (Maintained by Frontend Agent)
├── docker-compose.yml       # Production stack orchestrator
└── README.md
```

---

## Supported Scope (Bihar V1)

### Commodities
* **Cereals / Staples**: Maize (मक्का), Wheat (गेहूं), Paddy/Rice (धान)
* **Vegetables & Cash Crops**: Potato (आलू), Onion (प्याज), Tomato (टमाटर), Cauliflower (फूलगोभी)
* **Oilseeds & Pulses**: Mustard / Rai (सरसों), Gram / Chana (चना)

### Key Mandis & Districts
* **Purnia**: Gulabbagh Mandi (Eastern India's primary maize trading hub)
* **Patna**: Gulzarbagh & Mithapur Mandis
* **Nalanda**: Bihar Sharif (Vegetable & cold-storage hub)
* **Muzaffarpur**: Brahmpura Mandi
* **Samastipur, Begusarai, Rohtas (Sasaram), Vaishali (Hajipur)**

### Land Measurements
* Native Bihar revenue scale conversions:
  * `1 Bigha = 20 Katha = 0.625 Acre`
  * `1 Katha = 0.03125 Acre`
  * `1 Acre = 1.6 Bigha = 0.4047 Hectare`

---

## Backend Services & Architecture

| Module | Purpose |
| --- | --- |
| 🔐 **Auth & RBAC** | Role-based accounts (`FARMER`, `DISTRIBUTOR`, `BUYER`), bcrypt hashing, JWT tokens, structured KYC status (`UNVERIFIED`, `PHONE_VERIFIED`, `BUSINESS_VERIFIED`, `KYC_VERIFIED`). No raw Aadhaar stored. |
| 📊 **Market Ingestion** | Pipeline separating ingestion from client API: `External Feed → Validation → Normalization → Database → API`. |
| 🤖 **Forecast API** | Clean contract `POST /forecast/price` and `POST /api/forecast/price` providing central estimate, upper/lower bounds, confidence rating, and transparent agro-climatic limitations. |
| 🌾 **Crop Economics Engine** | ICAR / BAU Sabour benchmarks, itemized costs (seeds, fertilizer, labour, irrigation, machinery), and 3 scenarios: `conservative`, `expected`, `high-price`. Sources explicitly tagged. |
| 🚚 **Market Realization** | Ranks mandis by distance-adjusted net cash-in-hand rather than raw headline price: `Net = Mandi Price - Transport - Mandi Fees`. |
| 🤝 **Buyer Directory** | Role-specific verified directory, structured supply inquiry creation (`POST /api/buyers/{id}/inquire`), and buyer response workflow. |
| 🌦️ **Agro-Weather** | Open-Meteo integration for Bihar coordinates with 1-hour database caching and agricultural spray advisories. No frontend API key leakage. |

---

## Getting Started (Local Development)

### 1. Requirements
* Python 3.10+ (tested on Python 3.13)
* SQLite (default) or PostgreSQL

### 2. Setup Environment
```bash
# Navigate to workspace
cd FarmHub

# Create and activate virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment variables
cp backend/.env.example backend/.env
```

### 3. Run Backend Server
```bash
uvicorn backend.app.main:app --reload --port 8000
```
On initial startup, database tables and verified Bihar mandi records are automatically initialized and seeded.

* API Root: `http://localhost:8000`
* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

---

## Running Automated Tests

FarmHub includes comprehensive unit and integration tests:

```bash
python -m pytest backend/tests/ -v
```

### Test Coverage (21 Tests):
* `test_unit_converter.py`: Tests Bihar Bigha, Katha, Acre, Hectare, Quintals, Maund, and price conversions.
* `test_economics.py`: Tests cost breakdowns, net profit, margin %, break-even price, and multi-scenario outputs.
* `test_forecast_api.py`: Validates input and output schemas of `POST /forecast/price` and `POST /api/forecast/price`.
* `test_auth.py`: Tests user registration, role enforcement (`FARMER`, `BUYER`), JWT issuance, password hashing.
* `test_market_api.py`: Tests current prices, historical data querying, normalization, and mandi net realization comparison.
* `test_buyers_api.py`: Tests buyer directory filtering and farmer-buyer inquiry workflow.

---

## Production Deployment

### Docker Deployment
```bash
docker-compose up -d --build
```
Healthcheck runs automatically at `http://localhost:8000/health`.

### Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `ENVIRONMENT` | Environment mode (`development` / `production`) | `development` |
| `SECRET_KEY` | 32+ character JWT signing key | *(Set secure key in prod)* |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./farmhub.db` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:5173,http://localhost:3000` |
| `RATE_LIMIT_PER_MINUTE` | Max requests per IP per minute | `100` |
| `WEATHER_CACHE_TTL_SECONDS`| Weather forecast DB cache duration | `3600` |

---

## Frontend Integration Contracts

For Frontend and ML team coordination, consult [`backend/API_CONTRACTS.md`](backend/API_CONTRACTS.md) for full request/response schemas.

---

## Roadmap

- [x] Project foundation & repository architecture
- [x] Market data ingestion & normalization pipeline
- [x] Historical price database & time-series
- [x] Weather integration with agricultural spray advisory & DB caching
- [x] Crop economics engine with multi-scenario projections & source tracking
- [x] Baseline forecasting model contract (`POST /forecast/price`)
- [x] Farmer profile with Bihar land units (Bigha / Katha) & no raw Aadhaar
- [x] Distributor / buyer profile with structured KYC status
- [x] Distance-adjusted nearby market comparison (net realization)
- [x] Farmer ↔ Buyer inquiry workflow
- [x] Automated test suite (21 unit & integration tests passing)
- [x] Production Docker container & deployment configuration
- [ ] Frontend mobile-first implementation (Dedicated Frontend Agent)
- [ ] Advanced time-series model training & backtesting (Dedicated ML Agent)

---

<div align="center">

### Built with intent, data and field validation.

**FarmHub · Presented by .dot**

</div>
