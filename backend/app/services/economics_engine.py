"""
Crop Economics Calculation Engine for FarmHub.
Supports granular cost parameters, multi-scenario evaluation (conservative, expected, high-price),
and source tracking (ICAR_BAU_ESTIMATE vs USER_CUSTOMIZED).
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.app.services.unit_converter import to_acres
from backend.app.services.crops_catalog import get_crop_by_name

class EconomicsInput(BaseModel):
    crop: str
    land_area: float = Field(gt=0, description="Land area in local units")
    local_land_unit: str = Field(default="bigha", description="bigha, katha, acre, hectare")

    # Optional overrides; if None, derived from ICAR/BAU regional baselines
    expected_yield_per_acre: Optional[float] = None
    seed_cost_per_acre: Optional[float] = None
    fertilizer_cost_per_acre: Optional[float] = None
    pesticide_cost_per_acre: Optional[float] = None
    organic_manure_cost_per_acre: Optional[float] = None
    labour_cost_per_acre: Optional[float] = None
    irrigation_cost_per_acre: Optional[float] = None
    machinery_cost_per_acre: Optional[float] = None
    packaging_cost_per_quintal: Optional[float] = None
    transport_cost_per_quintal: Optional[float] = None
    mandi_charges_pct: Optional[float] = None
    wastage_pct: Optional[float] = None
    expected_selling_price_quintal: Optional[float] = None

class CostItem(BaseModel):
    category: str
    amount_inr: float
    source: str  # "ICAR_BAU_ESTIMATE" or "USER_CUSTOMIZED"

class ScenarioResult(BaseModel):
    scenario: str  # "conservative", "expected", "high-price"
    yield_quintals_total: float
    effective_saleable_quintals: float
    selling_price_per_quintal: float
    total_cost_inr: float
    cost_per_quintal_inr: float
    gross_revenue_inr: float
    net_profit_inr: float
    profit_margin_pct: float
    return_on_investment_pct: float

class EconomicsResult(BaseModel):
    crop: str
    land_area: float
    local_land_unit: str
    acres_equivalent: float
    scenarios: Dict[str, ScenarioResult]
    cost_breakdown: Dict[str, CostItem]
    total_estimated_production_cost_inr: float
    break_even_price_inr_quintal: float
    assumptions_summary: Dict[str, Any]

def calculate_crop_economics(data: EconomicsInput) -> EconomicsResult:
    crop_info = get_crop_by_name(data.crop)
    if not crop_info:
        raise ValueError(f"Unknown crop: '{data.crop}'. Available crops: Maize, Wheat, Paddy, Potato, Onion, Tomato, Mustard, Gram, Cauliflower.")

    benchmarks = crop_info["benchmarks_per_acre"]
    acres = to_acres(data.land_area, data.local_land_unit)

    # Resolve values and tag sources
    def resolve(custom_val, benchmark_val, category_name):
        if custom_val is not None and custom_val >= 0:
            return custom_val, "USER_CUSTOMIZED"
        return benchmark_val, "ICAR_BAU_ESTIMATE"

    yield_per_acre, yield_src = resolve(data.expected_yield_per_acre, benchmarks["yield_quintals"], "yield")
    seed_cost_rate, seed_src = resolve(data.seed_cost_per_acre, benchmarks["seed_cost_inr"], "seed")
    fert_cost_rate, fert_src = resolve(data.fertilizer_cost_per_acre, benchmarks["fertilizer_cost_inr"], "fertilizer")
    pest_cost_rate, pest_src = resolve(data.pesticide_cost_per_acre, benchmarks["pesticide_cost_inr"], "pesticide")
    manure_cost_rate, manure_src = resolve(data.organic_manure_cost_per_acre, benchmarks["organic_manure_cost_inr"], "manure")
    labour_cost_rate, labour_src = resolve(data.labour_cost_per_acre, benchmarks["labour_cost_inr"], "labour")
    irrig_cost_rate, irrig_src = resolve(data.irrigation_cost_per_acre, benchmarks["irrigation_cost_inr"], "irrigation")
    mach_cost_rate, mach_src = resolve(data.machinery_cost_per_acre, benchmarks["machinery_cost_inr"], "machinery")
    pack_rate, pack_src = resolve(data.packaging_cost_per_quintal, benchmarks["packaging_cost_per_quintal_inr"], "packaging")
    transport_rate, trans_src = resolve(data.transport_cost_per_quintal, 45.0, "transport")  # ₹45/quintal default local transport
    mandi_fee_pct, mandi_src = resolve(data.mandi_charges_pct, benchmarks["mandi_charges_pct"], "mandi_fee")
    wastage_pct, waste_src = resolve(data.wastage_pct, benchmarks["wastage_pct"], "wastage")
    base_price, price_src = resolve(data.expected_selling_price_quintal, benchmarks["baseline_price_inr_quintal"], "price")

    # Base production costs for total acres
    seed_total = seed_cost_rate * acres
    fert_total = fert_cost_rate * acres
    pest_total = pest_cost_rate * acres
    manure_total = manure_cost_rate * acres
    labour_total = labour_cost_rate * acres
    irrig_total = irrig_cost_rate * acres
    mach_total = mach_cost_rate * acres

    farm_production_cost = (
        seed_total + fert_total + pest_total + manure_total +
        labour_total + irrig_total + mach_total
    )

    cost_breakdown = {
        "seeds": CostItem(category="Seeds & Seedlings", amount_inr=round(seed_total, 2), source=seed_src),
        "fertilizers": CostItem(category="Chemical & Micronutrient Fertilizers", amount_inr=round(fert_total, 2), source=fert_src),
        "crop_protection": CostItem(category="Pesticides & Fungicides", amount_inr=round(pest_total, 2), source=pest_src),
        "organic_manure": CostItem(category="Organic Manure & Compost", amount_inr=round(manure_total, 2), source=manure_src),
        "labour": CostItem(category="Field Labour (Sowing, Weeding, Harvesting)", amount_inr=round(labour_total, 2), source=labour_src),
        "irrigation": CostItem(category="Irrigation & Diesel/Electricity", amount_inr=round(irrig_total, 2), source=irrig_src),
        "machinery": CostItem(category="Tractor & Harvester Rental", amount_inr=round(mach_total, 2), source=mach_src),
    }

    # Helper for building scenarios
    def build_scenario(name: str, yield_mult: float, price_mult: float, cost_buffer_mult: float) -> ScenarioResult:
        total_produced_quintals = (yield_per_acre * acres) * yield_mult
        wastage_adjusted_yield = total_produced_quintals * (1.0 - (wastage_pct / 100.0))

        # Packaging and transport scale with produced volume
        packaging_total = pack_rate * total_produced_quintals
        transport_total = transport_rate * total_produced_quintals
        base_cost = (farm_production_cost * cost_buffer_mult) + packaging_total + transport_total

        unit_selling_price = base_price * price_mult
        gross_revenue = wastage_adjusted_yield * unit_selling_price

        # Mandi charges on gross revenue
        mandi_fee_total = gross_revenue * (mandi_fee_pct / 100.0)
        final_total_cost = base_cost + mandi_fee_total

        net_profit = gross_revenue - final_total_cost
        margin_pct = (net_profit / gross_revenue * 100.0) if gross_revenue > 0 else 0.0
        roi_pct = (net_profit / final_total_cost * 100.0) if final_total_cost > 0 else 0.0
        cost_per_q = (final_total_cost / wastage_adjusted_yield) if wastage_adjusted_yield > 0 else 0.0

        return ScenarioResult(
            scenario=name,
            yield_quintals_total=round(total_produced_quintals, 2),
            effective_saleable_quintals=round(wastage_adjusted_yield, 2),
            selling_price_per_quintal=round(unit_selling_price, 2),
            total_cost_inr=round(final_total_cost, 2),
            cost_per_quintal_inr=round(cost_per_q, 2),
            gross_revenue_inr=round(gross_revenue, 2),
            net_profit_inr=round(net_profit, 2),
            profit_margin_pct=round(margin_pct, 1),
            return_on_investment_pct=round(roi_pct, 1)
        )

    # Scenarios: conservative, expected, high-price
    scenarios = {
        "conservative": build_scenario("conservative", yield_mult=0.85, price_mult=0.90, cost_buffer_mult=1.10),
        "expected": build_scenario("expected", yield_mult=1.00, price_mult=1.00, cost_buffer_mult=1.00),
        "high-price": build_scenario("high-price", yield_mult=1.10, price_mult=1.12, cost_buffer_mult=1.00),
    }

    expected = scenarios["expected"]
    fee_fraction = max(0.0, min(mandi_fee_pct / 100.0, 0.95))
    expected_fixed_cost = expected.total_cost_inr - (expected.gross_revenue_inr * fee_fraction)
    break_even_price = expected_fixed_cost / max(expected.effective_saleable_quintals * (1.0 - fee_fraction), 0.01)

    return EconomicsResult(
        crop=crop_info["name"],
        land_area=data.land_area,
        local_land_unit=data.local_land_unit,
        acres_equivalent=round(acres, 3),
        scenarios=scenarios,
        cost_breakdown=cost_breakdown,
        total_estimated_production_cost_inr=round(farm_production_cost, 2),
        assumptions_summary={
            "yield_per_acre_quintals": yield_per_acre,
            "baseline_price_inr_quintal": base_price,
            "wastage_pct": wastage_pct,
            "mandi_charges_pct": mandi_fee_pct,
            "packaging_cost_per_quintal": pack_rate,
            "transport_cost_per_quintal": transport_rate
        }
    )
