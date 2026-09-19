const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");

export interface CropBenchmark {
  yield_quintals: number;
  seed_cost_inr: number;
  fertilizer_cost_inr: number;
  pesticide_cost_inr: number;
  organic_manure_cost_inr: number;
  labour_cost_inr: number;
  irrigation_cost_inr: number;
  machinery_cost_inr: number;
  packaging_cost_per_quintal_inr: number;
  mandi_charges_pct: number;
  wastage_pct: number;
  baseline_price_inr_quintal: number;
}

export interface CropDetail {
  id: string;
  name: string;
  name_hi: string;
  category: string;
  season: string;
  major_districts: string[];
  duration_days: number;
  sowing_window: string;
  harvest_window: string;
  benchmarks_per_acre: CropBenchmark;
  description: string;
}

export interface MandiRecord {
  id: number;
  market: string;
  district: string;
  state: string;
  commodity: string;
  variety?: string | null;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrivals_volume?: number | null;
  record_date: string;
}

export interface MandiSummary {
  market: string;
  district: string;
  commodities_traded: string[];
}

export interface PriceHistory {
  commodity: string;
  market: string;
  district: string;
  history: MandiRecord[];
  statistics: {
    count: number;
    min_modal_price: number;
    max_modal_price: number;
    avg_modal_price: number;
    latest_modal_price: number;
    days_span: number;
  };
}

export interface ForecastResponse {
  central_estimate: number;
  lower_bound: number;
  upper_bound: number;
  unit: string;
  forecast_date: string;
  target_date: string;
  model_version: string;
  confidence: "HIGH" | "MODERATE" | "LOW";
  limitations: string[];
}

export interface MarketComparisonItem {
  market: string;
  district: string;
  distance_km: number;
  reported_price_quintal: number;
  estimated_transport_cost_quintal: number;
  mandi_charges_quintal: number;
  estimated_net_realization_quintal: number;
  is_best_net_value: boolean;
}

export interface ScenarioResult {
  scenario: string;
  yield_quintals_total: number;
  effective_saleable_quintals: number;
  selling_price_per_quintal: number;
  total_cost_inr: number;
  cost_per_quintal_inr: number;
  gross_revenue_inr: number;
  net_profit_inr: number;
  profit_margin_pct: number;
  return_on_investment_pct: number;
}

export interface EconomicsResult {
  crop: string;
  land_area: number;
  local_land_unit: string;
  acres_equivalent: number;
  scenarios: Record<string, ScenarioResult>;
  cost_breakdown: Record<string, { category: string; amount_inr: number; source: string }>;
  total_estimated_production_cost_inr: number;
  assumptions_summary: Record<string, unknown>;
}

export interface BuyerDirectoryItem {
  id: number;
  user_id: number;
  business_name: string;
  district: string;
  state: string;
  operating_regions: string[];
  crops_purchased: string[];
  approx_monthly_quantity_quintals: number;
  verification_status: string;
  contact_method: string;
}

export interface UserResponse {
  id: number;
  phone: string;
  email?: string | null;
  full_name: string;
  role: string;
  verification_status: string;
  is_active: boolean;
  farmer_profile?: {
    id: number;
    district: string;
    block_or_village?: string | null;
    state: string;
    preferred_language: string;
    land_area: number;
    local_land_unit: string;
    irrigation_availability: boolean;
    irrigation_type: string;
    crops: string[];
    farming_information?: string | null;
  } | null;
  buyer_profile?: unknown;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  full_name: string;
  role: string;
  phone: string;
  verification_status: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("farmhub_token");
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    let message = `FarmHub API error (${response.status})`;
    try {
      const payload = await response.json();
      if (typeof payload?.detail === "string") message = payload.detail;
    } catch {
      // Preserve the status message for non-JSON responses.
    }
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
}

export const farmHubApi = {
  getCrops() {
    return request<CropDetail[]>("/crops");
  },
  getCrop(name: string) {
    return request<CropDetail>(`/crops/${encodeURIComponent(name)}`);
  },
  getMe() {
    return request<UserResponse>("/auth/me");
  },
  getMandis() {
    return request<MandiSummary[]>("/market/mandis");
  },
  getCurrentPrices(params: { crop?: string; district?: string; market?: string } = {}) {
    const search = new URLSearchParams();
    if (params.crop) search.set("crop", params.crop);
    if (params.district) search.set("district", params.district);
    if (params.market) search.set("market", params.market);
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<MandiRecord[]>(`/market/prices/current${suffix}`);
  },
  getPriceHistory(crop: string, market: string, days = 90) {
    const search = new URLSearchParams({ crop, market, days: String(days) });
    return request<PriceHistory>(`/market/prices/history?${search.toString()}`);
  },
  compareMarkets(body: {
    farmer_district: string;
    crop: string;
    quantity_quintals: number;
    transport_rate_per_km_quintal?: number;
    mandi_fee_pct?: number;
  }) {
    return request<MarketComparisonItem[]>("/market/compare", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  calculateEconomics(body: Record<string, unknown>) {
    return request<EconomicsResult>("/economics/calculate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  forecastPrice(body: { crop: string; location: string; market: string; harvest_date: string }) {
    return request<ForecastResponse>("/forecast/price", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  getBuyers(params: { crop?: string; district?: string; verified_only?: boolean } = {}) {
    const search = new URLSearchParams();
    if (params.crop) search.set("crop", params.crop);
    if (params.district) search.set("district", params.district);
    if (params.verified_only !== undefined) search.set("verified_only", String(params.verified_only));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<BuyerDirectoryItem[]>(`/buyers${suffix}`);
  },
  register(body: Record<string, unknown>) {
    return request<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) });
  },
  login(body: { phone: string; password: string }) {
    return request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) });
  },
};

export function formatINR(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits,
  }).format(value);
}
