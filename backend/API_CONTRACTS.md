# FarmHub Backend API Contracts & Integration Guide

This document defines the complete backend API contracts for FarmHub V1 (Bihar Launch), presented by `.dot`.
Frontend and Data/ML agents should rely exclusively on these typed contracts.

Base URL (Local): `http://localhost:8000`
API Prefix: `/api`
Interactive Swagger Docs: `http://localhost:8000/docs`
ReDoc: `http://localhost:8000/redoc`

---

## 1. Authentication & Role-Based Profiles

### 1.1 User Registration
- **Endpoint**: `POST /api/auth/register`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "phone": "9876543210",
    "full_name": "Ramesh Kumar",
    "password": "securepassword123",
    "role": "FARMER",
    "email": "ramesh@example.com",
    "district": "Purnia",
    "land_area": 4.0,
    "local_land_unit": "bigha",
    "irrigation_availability": true,
    "crops": ["Maize", "Potato"]
  }
  ```
  *(For `BUYER` or `DISTRIBUTOR`, supply `business_name`, `operating_regions`, and `crops_purchased`)*
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user_id": 1,
    "full_name": "Ramesh Kumar",
    "role": "FARMER",
    "phone": "9876543210",
    "verification_status": "PHONE_VERIFIED"
  }
  ```

### 1.2 User Login
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "phone": "9876543210",
    "password": "securepassword123"
  }
  ```
- **Response** (`200 OK`): Same as `Token` above.

### 1.3 Get Current Profile
- **Endpoint**: `GET /api/auth/me`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response** (`200 OK`):
  ```json
  {
    "id": 1,
    "phone": "9876543210",
    "email": "ramesh@example.com",
    "full_name": "Ramesh Kumar",
    "role": "FARMER",
    "verification_status": "PHONE_VERIFIED",
    "is_active": true,
    "farmer_profile": {
      "id": 1,
      "district": "Purnia",
      "block_or_village": "Kasba",
      "state": "Bihar",
      "preferred_language": "hi",
      "land_area": 4.0,
      "local_land_unit": "bigha",
      "irrigation_availability": true,
      "irrigation_type": "borewell_diesel",
      "crops": ["Maize", "Potato", "Wheat"],
      "farming_information": null
    },
    "buyer_profile": null,
    "created_at": "2026-09-17T04:54:51.123456Z"
  }
  ```

---

## 2. Crop Catalog & Agronomic Baselines

### 2.1 List Bihar V1 Crops
- **Endpoint**: `GET /api/crops`
- **Auth**: None
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "maize",
      "name": "Maize",
      "name_hi": "मक्का",
      "category": "Cereal / Cash Crop",
      "season": "Rabi / Kharif",
      "major_districts": ["Purnia", "Katihar", "Begusarai", "Khagaria", "Samastipur"],
      "duration_days": 120,
      "sowing_window": "Oct 15 - Nov 30 (Rabi) / Jun 15 - Jul 15 (Kharif)",
      "harvest_window": "Mar 15 - Apr 30 (Rabi) / Sep 15 - Oct 30 (Kharif)",
      "benchmarks_per_acre": {
        "yield_quintals": 32.0,
        "seed_cost_inr": 2800.0,
        "fertilizer_cost_inr": 3600.0,
        "pesticide_cost_inr": 1400.0,
        "organic_manure_cost_inr": 1200.0,
        "labour_cost_inr": 4800.0,
        "irrigation_cost_inr": 2200.0,
        "machinery_cost_inr": 3200.0,
        "packaging_cost_per_quintal_inr": 35.0,
        "mandi_charges_pct": 1.5,
        "wastage_pct": 3.0,
        "baseline_price_inr_quintal": 2180.0
      },
      "description": "Bihar is one of India's largest maize hubs..."
    }
  ]
  ```

---

## 3. Crop Economics & Scenarios Engine

### 3.1 Calculate Economics
- **Endpoint**: `POST /api/economics/calculate`
- **Request Body**:
  ```json
  {
    "crop": "Maize",
    "land_area": 4.0,
    "local_land_unit": "bigha",
    "expected_yield_per_acre": null,
    "seed_cost_per_acre": null,
    "fertilizer_cost_per_acre": null,
    "expected_selling_price_quintal": 2200.0
  }
  ```
  *(Values passed as `null` are populated automatically from ICAR/BAU regional benchmarks)*
- **Response** (`200 OK`):
  ```json
  {
    "crop": "Maize",
    "land_area": 4.0,
    "local_land_unit": "bigha",
    "acres_equivalent": 2.5,
    "scenarios": {
      "conservative": {
        "scenario": "conservative",
        "yield_quintals_total": 68.0,
        "effective_saleable_quintals": 65.96,
        "selling_price_per_quintal": 1980.0,
        "total_cost_inr": 58732.14,
        "cost_per_quintal_inr": 890.42,
        "gross_revenue_inr": 130600.8,
        "net_profit_inr": 71868.66,
        "profit_margin_pct": 55.0,
        "return_on_investment_pct": 122.4
      },
      "expected": {
        "scenario": "expected",
        "yield_quintals_total": 80.0,
        "effective_saleable_quintals": 77.6,
        "selling_price_per_quintal": 2200.0,
        "total_cost_inr": 55960.8,
        "cost_per_quintal_inr": 721.14,
        "gross_revenue_inr": 170720.0,
        "net_profit_inr": 114759.2,
        "profit_margin_pct": 67.2,
        "return_on_investment_pct": 205.1
      },
      "high-price": {
        "scenario": "high-price",
        "yield_quintals_total": 88.0,
        "effective_saleable_quintals": 85.36,
        "selling_price_per_quintal": 2464.0,
        "total_cost_inr": 56910.8,
        "cost_per_quintal_inr": 666.71,
        "gross_revenue_inr": 210327.04,
        "net_profit_inr": 153416.24,
        "profit_margin_pct": 72.9,
        "return_on_investment_pct": 269.6
      }
    },
    "cost_breakdown": {
      "seeds": {
        "category": "Seeds & Seedlings",
        "amount_inr": 7000.0,
        "source": "ICAR_BAU_ESTIMATE"
      },
      "labour": {
        "category": "Field Labour (Sowing, Weeding, Harvesting)",
        "amount_inr": 12000.0,
        "source": "ICAR_BAU_ESTIMATE"
      }
    },
    "total_estimated_production_cost_inr": 48000.0,
    "assumptions_summary": { ... }
  }
  ```

---

## 4. Price Forecast Contract (ML Team Contract)

### 4.1 Price Forecast
- **Endpoint**: `POST /forecast/price` (also available at `POST /api/forecast/price`)
- **Request Body**:
  ```json
  {
    "crop": "Maize",
    "location": "Purnia",
    "market": "Gulabbagh",
    "harvest_date": "2026-11-20"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "central_estimate": 2245.4,
    "lower_bound": 1998.41,
    "upper_bound": 2492.39,
    "unit": "INR/quintal",
    "forecast_date": "2026-09-17",
    "target_date": "2026-11-20",
    "model_version": "v1.2.0-bihar-seasonal-arima-prophet",
    "confidence": "MODERATE",
    "limitations": [
      "Forecast reflects typical historical seasonal arrival curve in Bihar Mandis (target month: November).",
      "Assumes absence of extreme unseasonal rainfall or cyclone events during harvest/drying window.",
      "Horizon exceeds 60 days: wider band accounts for potential changes in inter-state freight and trade policy."
    ]
  }
  ```

---

## 5. Market Data & Comparison

### 5.1 Mandis Directory
- **Endpoint**: `GET /api/market/mandis`
- **Response** (`200 OK`): List of mandis with district and commodities traded.

### 5.2 Current Mandi Prices
- **Endpoint**: `GET /api/market/prices/current?crop=Maize&district=Purnia`
- **Response** (`200 OK`): List of current prices with min, max, modal prices and arrival volume.

### 5.3 Historical Price Series
- **Endpoint**: `GET /api/market/prices/history?crop=Maize&market=Gulabbagh%20(Purnia)&days=30`
- **Response** (`200 OK`): Daily time-series with summary statistics (`min_modal_price`, `max_modal_price`, `avg_modal_price`).

### 5.4 Distance-Adjusted Market Realization Comparison
- **Endpoint**: `POST /api/market/compare`
- **Request Body**:
  ```json
  {
    "farmer_district": "Purnia",
    "crop": "Maize",
    "quantity_quintals": 50.0,
    "transport_rate_per_km_quintal": 0.90,
    "mandi_fee_pct": 1.5
  }
  ```
- **Response** (`200 OK`):
  ```json
  [
    {
      "market": "Gulabbagh (Purnia)",
      "district": "Purnia",
      "distance_km": 6.0,
      "reported_price_quintal": 2234.5,
      "estimated_transport_cost_quintal": 35.0,
      "mandi_charges_quintal": 33.52,
      "estimated_net_realization_quintal": 2165.98,
      "estimated_total_net_realization": 108299.0,
      "is_best_net_value": true,
      "price_advantage_vs_nearest_inr": 0.0,
      "recommendation_note": "Best choice: Lowest transport and highest net realization."
    }
  ]
  ```

### 5.5 Market Data Ingestion Pipeline
- **Endpoint**: `POST /api/market/ingest`
- **Payload**: Array of raw records for validation, normalization, and persistence.

---

## 6. Buyer Directory & Farmer Inquiries

### 6.1 Buyer Directory
- **Endpoint**: `GET /api/buyers?crop=Maize&district=Purnia&verified_only=false`
- **Response** (`200 OK`): List of active buyers with verification badges.

### 6.2 Submit Supply Inquiry
- **Endpoint**: `POST /api/buyers/{buyer_user_id}/inquire`
- **Headers**: `Authorization: Bearer <farmer_token>`
- **Request Body**:
  ```json
  {
    "buyer_id": 2,
    "crop": "Maize",
    "quantity_quintals": 80.0,
    "expected_harvest_date": "2026-11-25",
    "target_price_inr": 2200.0,
    "notes": "Grade A sun-dried, moisture < 12%"
  }
  ```
- **Response** (`200 OK`): Inquiry object with status `PENDING`.

### 6.3 List Inquiries
- **Endpoint**: `GET /api/inquiries`
- **Headers**: `Authorization: Bearer <token>`
- Returns inquiries sent by the farmer or received by the buyer.

### 6.4 Update Inquiry Status (Buyer Action)
- **Endpoint**: `PATCH /api/inquiries/{inquiry_id}/status`
- **Headers**: `Authorization: Bearer <buyer_token>`
- **Request Body**:
  ```json
  {
    "status": "ACCEPTED",
    "buyer_response": "Agreed. Bring sample to gate 2."
  }
  ```

---

## 7. Agricultural Weather & Spray Advisories

### 7.1 District Weather
- **Endpoint**: `GET /api/weather/{district}`
- **Response** (`200 OK`):
  ```json
  {
    "district": "Purnia",
    "latitude": 25.7771,
    "longitude": 87.4753,
    "current_temperature_c": 29.5,
    "current_wind_speed_kmh": 8.0,
    "today_spray_advisory": {
      "status": "EXCELLENT",
      "message": "Clear conditions with calm winds. Ideal for foliar spray and field harvesting.",
      "color": "green"
    },
    "seven_day_forecast": [ ... ],
    "source": "Open-Meteo Agro-Climatology",
    "updated_at": "2026-09-17T04:54:51.123456Z"
  }
  ```
