"""
Unit Conversion Engine for FarmHub Bihar V1 Launch.
Handles local Bihar land units (Bigha, Katha, Acre, Hectare) and commodity weight units.
"""
from typing import Dict

# Bihar Land Conversion Constants (Standard Bihar Revenue Scale: 1 Acre = 1.6 Bigha, 1 Bigha = 20 Katha)
ACRES_PER_UNIT: Dict[str, float] = {
    "acre": 1.0,
    "bigha": 0.625,        # 1 Bigha = 0.625 Acre (20 Katha)
    "katha": 0.03125,      # 1 Katha = 1/20 Bigha = 0.03125 Acre
    "hectare": 2.47105,    # 1 Hectare = 2.47105 Acres
}

# Weight Conversion Constants to Quintals (standard APMC mandi quotation base)
QUINTALS_PER_WEIGHT_UNIT: Dict[str, float] = {
    "quintal": 1.0,
    "kg": 0.01,
    "kilogram": 0.01,
    "tonne": 10.0,
    "metric_tonne": 10.0,
    "maund": 0.4,          # 1 Maund (Man) = 40 kg = 0.4 Quintal in Bihar
}

def to_acres(area: float, unit: str) -> float:
    """Converts any supported land unit to standard Acres."""
    normalized_unit = unit.lower().strip()
    if normalized_unit not in ACRES_PER_UNIT:
        raise ValueError(f"Unsupported land unit: '{unit}'. Supported units: {list(ACRES_PER_UNIT.keys())}")
    if area < 0:
        raise ValueError("Land area cannot be negative.")
    return area * ACRES_PER_UNIT[normalized_unit]

def from_acres(acres: float, target_unit: str) -> float:
    """Converts standard Acres to target land unit."""
    normalized_target = target_unit.lower().strip()
    if normalized_target not in ACRES_PER_UNIT:
        raise ValueError(f"Unsupported target land unit: '{target_unit}'")
    if acres < 0:
        raise ValueError("Land area cannot be negative.")
    return acres / ACRES_PER_UNIT[normalized_target]

def convert_land(area: float, from_unit: str, to_unit: str) -> float:
    """Converts area from one land unit to another."""
    acres = to_acres(area, from_unit)
    return from_acres(acres, to_unit)

def to_quintals(quantity: float, unit: str) -> float:
    """Converts a given weight to standard quintals."""
    normalized_unit = unit.lower().strip()
    if normalized_unit not in QUINTALS_PER_WEIGHT_UNIT:
        raise ValueError(f"Unsupported weight unit: '{unit}'. Supported units: {list(QUINTALS_PER_WEIGHT_UNIT.keys())}")
    if quantity < 0:
        raise ValueError("Quantity cannot be negative.")
    return quantity * QUINTALS_PER_WEIGHT_UNIT[normalized_unit]

def price_per_quintal(price: float, current_unit: str) -> float:
    """Converts a price quote from another unit to INR / quintal."""
    normalized_unit = current_unit.lower().strip().replace("inr/", "").replace("rs/", "").replace("₹/", "")
    if normalized_unit == "quintal":
        return price
    elif normalized_unit in ("kg", "kilogram"):
        return price * 100.0
    elif normalized_unit in ("tonne", "metric_tonne"):
        return price / 10.0
    elif normalized_unit == "maund":
        return price / 0.4
    else:
        raise ValueError(f"Unsupported price unit: '{current_unit}'")
