// API Client for FarmHub / SLAM Market Intelligence Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const DIRECT_FORECAST_URL = import.meta.env.VITE_FORECAST_URL || "http://localhost:8000";

// Robust fetch helper with timeout and fallback support
async function apiRequest(endpoint, options = {}, fallbackData = null) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (err) {
    console.warn(`[Backend Call Warning] ${endpoint}: ${err.message}. Using active fallback data.`);
    return fallbackData;
  }
}

// 1. Fetch Current Mandi Prices
export async function getCurrentPrices(crop = "", district = "", market = "") {
  const query = new URLSearchParams();
  if (crop) query.append("crop", crop);
  if (district) query.append("district", district);
  if (market) query.append("market", market);

  const fallback = [
    { id: 101, commodity: "Maize", market: "Gulabbagh", district: "Purnia", min_price: 2150, max_price: 2320, modal_price: 2240, arrival_quantity: 120, unit: "Quintal", record_date: "2026-09-17" },
    { id: 102, commodity: "Wheat", market: "Patna City", district: "Patna", min_price: 2400, max_price: 2580, modal_price: 2510, arrival_quantity: 85, unit: "Quintal", record_date: "2026-09-17" },
    { id: 103, commodity: "Paddy", market: "Muzaffarpur", district: "Muzaffarpur", min_price: 2180, max_price: 2300, modal_price: 2250, arrival_quantity: 150, unit: "Quintal", record_date: "2026-09-17" },
    { id: 104, commodity: "Potato", market: "Bihar Sharif", district: "Nalanda", min_price: 1450, max_price: 1650, modal_price: 1580, arrival_quantity: 210, unit: "Quintal", record_date: "2026-09-17" },
    { id: 105, commodity: "Mustard", market: "Gaya Mandi", district: "Gaya", min_price: 5200, max_price: 5600, modal_price: 5450, arrival_quantity: 60, unit: "Quintal", record_date: "2026-09-17" },
    { id: 106, commodity: "Onion", market: "Fatwah", district: "Patna", min_price: 1800, max_price: 2100, modal_price: 1980, arrival_quantity: 140, unit: "Quintal", record_date: "2026-09-17" },
  ];

  return apiRequest(`/market/prices/current?${query.toString()}`, {}, fallback);
}

// 2. Fetch Active Mandis List
export async function getMandis() {
  const fallback = [
    { market: "Gulabbagh", district: "Purnia", commodities_traded: ["Maize", "Paddy", "Wheat"] },
    { market: "Patna City", district: "Patna", commodities_traded: ["Wheat", "Mustard", "Onion"] },
    { market: "Bihar Sharif", district: "Nalanda", commodities_traded: ["Potato", "Onion", "Vegetables"] },
    { market: "Muzaffarpur", district: "Muzaffarpur", commodities_traded: ["Paddy", "Maize", "Litchi"] },
    { market: "Gaya Mandi", district: "Gaya", commodities_traded: ["Mustard", "Gram", "Wheat"] },
  ];

  return apiRequest("/market/mandis", {}, fallback);
}

// 3. Fetch Price History & Statistics
export async function getPriceHistory(crop = "Maize", market = "Gulabbagh", days = 90) {
  const fallback = {
    commodity: crop,
    market: market,
    district: "Purnia",
    history: Array.from({ length: 15 }, (_, i) => ({
      record_date: new Date(Date.now() - (14 - i) * 86400000).toISOString().split("T")[0],
      modal_price: Math.round(2100 + Math.sin(i * 0.5) * 120 + i * 8),
      min_price: Math.round(2000 + Math.sin(i * 0.5) * 100),
      max_price: Math.round(2250 + Math.sin(i * 0.5) * 130),
    })),
    statistics: {
      count: 15,
      min_modal_price: 2050,
      max_modal_price: 2350,
      avg_modal_price: 2210,
      latest_modal_price: 2280,
      days_span: days,
    }
  };

  return apiRequest(`/market/prices/history?crop=${encodeURIComponent(crop)}&market=${encodeURIComponent(market)}&days=${days}`, {}, fallback);
}

// 4. Compare Nearby Mandis
export async function compareMarkets(data) {
  const payload = {
    farmer_district: data.farmer_district || "Purnia",
    crop: data.crop || "Maize",
    quantity_quintals: Number(data.quantity_quintals) || 50,
    transport_rate_per_km_quintal: Number(data.transport_rate_per_km_quintal) || 2.5,
    mandi_fee_pct: Number(data.mandi_fee_pct) || 1.0,
  };

  const fallback = [
    {
      market: "Gulabbagh",
      district: "Purnia",
      gross_modal_price_per_qtl: 2280,
      estimated_distance_km: 12,
      total_transport_cost: 1500,
      mandi_fee_amount: 1140,
      net_realization_per_qtl: 2227.20,
      total_net_realization: 111360,
      recommendation_rank: 1,
      is_top_choice: true,
      notes: "Optimal net realization due to low transport distance."
    },
    {
      market: "Katihar Mandi",
      district: "Katihar",
      gross_modal_price_per_qtl: 2320,
      estimated_distance_km: 38,
      total_transport_cost: 4750,
      mandi_fee_amount: 1160,
      net_realization_per_qtl: 2201.80,
      total_net_realization: 110090,
      recommendation_rank: 2,
      is_top_choice: false,
      notes: "Higher gross price but higher haulage cost."
    },
    {
      market: "Saharsa Market",
      district: "Saharsa",
      gross_modal_price_per_qtl: 2240,
      estimated_distance_km: 65,
      total_transport_cost: 8125,
      mandi_fee_amount: 1120,
      net_realization_per_qtl: 2055.10,
      total_net_realization: 102755,
      recommendation_rank: 3,
      is_top_choice: false,
      notes: "Long distance reduces net profit."
    }
  ];

  return apiRequest("/market/compare", {
    method: "POST",
    body: JSON.stringify(payload),
  }, fallback);
}

// 5. ML Price Forecast (Calls direct /forecast/price or /api/v1/forecast/price)
export async function getPriceForecast(crop = "Maize", district = "Purnia", market = "Gulabbagh") {
  const payload = { crop, district, market };

  const fallback = {
    commodity: crop,
    market: market,
    district: district,
    current_modal_price: 2240,
    forecast_30d_modal_price: 2380,
    expected_change_pct: 6.25,
    trend_direction: "BULLISH",
    confidence_pct: 88.5,
    seasonality_summary: "Harvest peak starting to taper; regional demand from poultry mills increasing.",
    rationale: "Strong institutional buyer interest and declining mandi arrivals in adjacent districts.",
    projected_prices: [
      { date: "Day 1", price: 2240, lower: 2210, upper: 2270 },
      { date: "Day 7", price: 2275, lower: 2235, upper: 2315 },
      { date: "Day 14", price: 2310, lower: 2260, upper: 2360 },
      { date: "Day 21", price: 2345, lower: 2290, upper: 2400 },
      { date: "Day 30", price: 2380, lower: 2320, upper: 2440 }
    ]
  };

  return apiRequest(`${DIRECT_FORECAST_URL}/forecast/price`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, fallback);
}

// 6. Fetch Verified Institutional Buyers
export async function getBuyers(crop = "", district = "") {
  const fallback = [
    { id: "B1", name: "AgriCorp Processing Ltd", buyer_type: "Processor", verified: true, contact_person: "Ramesh Sharma", phone: "+91 98765 43210", district: "Purnia", min_quantity_quintals: 50, buying_price_offered: 2310, rating: 4.8 },
    { id: "B2", name: "Bihar Grain Exporters", buyer_type: "Exporter", verified: true, contact_person: "Anand Verma", phone: "+91 98123 45678", district: "Patna", min_quantity_quintals: 100, buying_price_offered: 2340, rating: 4.9 },
    { id: "B3", name: "Kisan Trading Co-op", buyer_type: "Trader", verified: true, contact_person: "Sanjay Kumar", phone: "+91 97654 32109", district: "Muzaffarpur", min_quantity_quintals: 20, buying_price_offered: 2270, rating: 4.6 },
    { id: "B4", name: "GreenField Feeds India", buyer_type: "Feed Mill", verified: true, contact_person: "Praveen Singh", phone: "+91 99887 76655", district: "Nalanda", min_quantity_quintals: 40, buying_price_offered: 2290, rating: 4.7 }
  ];

  return apiRequest(`/buyers?crop=${encodeURIComponent(crop)}&district=${encodeURIComponent(district)}`, {}, fallback);
}

// 7. Calculate Crop Profitability
export async function calculateProfitability(data) {
  const payload = {
    crop: data.crop || "Maize",
    land_area_acres: Number(data.land_area_acres) || 2.0,
    expected_yield_qtl_per_acre: Number(data.expected_yield_qtl_per_acre) || 25.0,
    expected_price_per_qtl: Number(data.expected_price_per_qtl) || 2250,
  };

  const fallback = {
    crop: payload.crop,
    land_area_acres: payload.land_area_acres,
    total_expected_yield_quintals: payload.land_area_acres * payload.expected_yield_qtl_per_acre,
    gross_revenue: payload.land_area_acres * payload.expected_yield_qtl_per_acre * payload.expected_price_per_qtl,
    estimated_total_cost: payload.land_area_acres * 18500,
    net_projected_profit: (payload.land_area_acres * payload.expected_yield_qtl_per_acre * payload.expected_price_per_qtl) - (payload.land_area_acres * 18500),
    roi_percentage: 143.2,
    cost_breakdown: {
      seed_cost: payload.land_area_acres * 3200,
      fertilizer_pesticide_cost: payload.land_area_acres * 6500,
      labor_machinery_cost: payload.land_area_acres * 6800,
      irrigation_other_cost: payload.land_area_acres * 2000
    }
  };

  return apiRequest("/economics/profitability", {
    method: "POST",
    body: JSON.stringify(payload),
  }, fallback);
}
