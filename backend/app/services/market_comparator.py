"""
Market Comparison Engine for FarmHub Bihar V1 Launch.
Computes distance-adjusted net realization across Bihar Mandis.
Ranks markets by net cash-in-hand rather than headline gross price.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# Approximate road distance matrix between key Bihar agricultural hubs (in km)
# Keyed by (origin_district, destination_market)
BIHAR_DISTANCES: Dict[str, Dict[str, float]] = {
    "Patna": {
        "Patna (Gulzarbagh)": 8.0,
        "Patna (Mithapur)": 5.0,
        "Hajipur (Vaishali)": 18.0,
        "Bihar Sharif (Nalanda)": 68.0,
        "Muzaffarpur": 75.0,
        "Bhojpur (Ara)": 55.0,
        "Gaya": 105.0,
        "Samastipur": 90.0,
        "Begusarai": 125.0,
        "Gulabbagh (Purnia)": 310.0
    },
    "Purnia": {
        "Gulabbagh (Purnia)": 6.0,
        "Katihar": 32.0,
        "Araria": 44.0,
        "Kishanganj": 70.0,
        "Saharsa": 102.0,
        "Madhepura": 78.0,
        "Bhagalpur": 98.0,
        "Begusarai": 210.0,
        "Patna (Gulzarbagh)": 310.0
    },
    "Muzaffarpur": {
        "Muzaffarpur (Brahmpura)": 4.0,
        "Hajipur (Vaishali)": 58.0,
        "Samastipur": 54.0,
        "Sitamarhi": 62.0,
        "Darbhanga": 66.0,
        "Patna (Gulzarbagh)": 75.0,
        "Begusarai": 115.0
    },
    "Nalanda": {
        "Bihar Sharif (Nalanda)": 5.0,
        "Patna (Gulzarbagh)": 68.0,
        "Gaya": 65.0,
        "Nawada": 35.0,
        "Munger": 115.0,
        "Begusarai": 90.0
    },
    "Samastipur": {
        "Samastipur": 4.0,
        "Muzaffarpur": 54.0,
        "Darbhanga": 38.0,
        "Begusarai": 70.0,
        "Patna (Gulzarbagh)": 90.0,
        "Hajipur (Vaishali)": 65.0
    },
    "Begusarai": {
        "Begusarai": 5.0,
        "Khagaria": 42.0,
        "Samastipur": 70.0,
        "Patna (Gulzarbagh)": 125.0,
        "Munger": 55.0,
        "Gulabbagh (Purnia)": 210.0
    },
    "Rohtas": {
        "Sasaram (Rohtas)": 6.0,
        "Dehri-on-Sone": 18.0,
        "Buxar": 75.0,
        "Bhojpur (Ara)": 105.0,
        "Gaya": 115.0,
        "Patna (Gulzarbagh)": 155.0
    },
    "Vaishali": {
        "Hajipur (Vaishali)": 5.0,
        "Patna (Gulzarbagh)": 18.0,
        "Muzaffarpur": 58.0,
        "Samastipur": 65.0,
        "Chhapra (Saran)": 50.0
    }
}

class MarketComparisonItem(BaseModel):
    market: str
    district: str
    distance_km: float
    reported_price_quintal: float
    estimated_transport_cost_quintal: float
    mandi_charges_quintal: float
    estimated_net_realization_quintal: float
    estimated_total_net_realization: float
    is_best_net_value: bool
    price_advantage_vs_nearest_inr: float
    recommendation_note: str

class MarketComparisonRequest(BaseModel):
    farmer_district: str
    crop: str
    quantity_quintals: float = Field(gt=0, default=25.0)
    transport_rate_per_km_quintal: float = Field(default=0.90, gt=0)  # ₹0.90 / km / quintal
    mandi_fee_pct: float = Field(default=1.5, ge=0)

def compare_markets(
    farmer_district: str,
    crop: str,
    quantity_quintals: float,
    reported_prices: List[Dict[str, Any]],
    transport_rate_per_km_quintal: float = 0.90,
    mandi_fee_pct: float = 1.5
) -> List[MarketComparisonItem]:
    """
    Ranks mandis by distance-adjusted net realization per quintal.
    """
    dist_map = BIHAR_DISTANCES.get(farmer_district, {})

    results: List[MarketComparisonItem] = []

    for item in reported_prices:
        market_name = item["market"]
        district = item.get("district", farmer_district)
        raw_price = item["modal_price"]

        # Determine distance
        distance = dist_map.get(market_name)
        if distance is None:
            # Fallback estimation based on district match
            if district.lower() == farmer_district.lower():
                distance = 15.0
            else:
                distance = 75.0

        # Transit costs: freight + baseline loading/unloading
        freight_per_q = max(20.0, distance * transport_rate_per_km_quintal)
        unloading_per_q = 15.0
        transport_cost_q = round(freight_per_q + unloading_per_q, 2)

        # Mandi cess
        mandi_charge_q = round(raw_price * (mandi_fee_pct / 100.0), 2)

        # Net Realization per quintal
        net_q = round(raw_price - transport_cost_q - mandi_charge_q, 2)
        total_net = round(net_q * quantity_quintals, 2)

        results.append(MarketComparisonItem(
            market=market_name,
            district=district,
            distance_km=distance,
            reported_price_quintal=raw_price,
            estimated_transport_cost_quintal=transport_cost_q,
            mandi_charges_quintal=mandi_charge_q,
            estimated_net_realization_quintal=net_q,
            estimated_total_net_realization=total_net,
            is_best_net_value=False,
            price_advantage_vs_nearest_inr=0.0,
            recommendation_note=""
        ))

    # Sort descending by net realization
    results.sort(key=lambda x: x.estimated_net_realization_quintal, reverse=True)

    if results:
        results[0].is_best_net_value = True

        # Find nearest mandi for comparative explanation
        nearest = min(results, key=lambda x: x.distance_km)
        for r in results:
            diff = round(r.estimated_net_realization_quintal - nearest.estimated_net_realization_quintal, 2)
            r.price_advantage_vs_nearest_inr = diff
            if r.is_best_net_value and r.market != nearest.market:
                r.recommendation_note = f"Provides ₹{diff}/q higher net realization than nearest mandi ({nearest.market}) after accounting for transport."
            elif r.is_best_net_value and r.market == nearest.market:
                r.recommendation_note = "Best choice: Lowest transport and highest net realization."
            elif r.reported_price_quintal > nearest.reported_price_quintal and r.estimated_net_realization_quintal < nearest.estimated_net_realization_quintal:
                r.recommendation_note = f"Caution: Higher headline price is negated by ₹{r.estimated_transport_cost_quintal}/q transport cost."
            else:
                r.recommendation_note = f"Net realization is ₹{abs(diff)}/q lower than best option."

    return results
