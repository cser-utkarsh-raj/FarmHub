from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class CropBenchmark(BaseModel):
    yield_quintals: float
    seed_cost_inr: float
    fertilizer_cost_inr: float
    pesticide_cost_inr: float
    organic_manure_cost_inr: float
    labour_cost_inr: float
    irrigation_cost_inr: float
    machinery_cost_inr: float
    packaging_cost_per_quintal_inr: float
    mandi_charges_pct: float
    wastage_pct: float
    baseline_price_inr_quintal: float

class CropDetail(BaseModel):
    id: str
    name: str
    name_hi: str
    category: str
    season: str
    major_districts: List[str]
    duration_days: int
    sowing_window: str
    harvest_window: str
    benchmarks_per_acre: CropBenchmark
    description: str
