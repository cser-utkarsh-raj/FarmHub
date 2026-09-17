"""
Bihar Crop Catalog & Agronomic Baselines for FarmHub V1.
Data calibrated to ICAR-RCER Patna and Bihar Agricultural University (BAU), Sabour.
"""
from typing import Dict, Any, List, Optional

BIHAR_CROPS: Dict[str, Dict[str, Any]] = {
    "Maize": {
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
        "description": "Bihar is one of India's largest maize hubs, with Gulabbagh (Purnia) serving as Eastern India's primary trading center."
    },
    "Wheat": {
        "id": "wheat",
        "name": "Wheat",
        "name_hi": "गेहूं",
        "category": "Cereal",
        "season": "Rabi",
        "major_districts": ["Rohtas", "Bhojpur", "Patna", "Buxar", "West Champaran"],
        "duration_days": 130,
        "sowing_window": "Nov 15 - Dec 15",
        "harvest_window": "Mar 25 - Apr 20",
        "benchmarks_per_acre": {
            "yield_quintals": 18.0,
            "seed_cost_inr": 1600.0,
            "fertilizer_cost_inr": 2900.0,
            "pesticide_cost_inr": 900.0,
            "organic_manure_cost_inr": 1000.0,
            "labour_cost_inr": 4200.0,
            "irrigation_cost_inr": 2600.0,
            "machinery_cost_inr": 2800.0,
            "packaging_cost_per_quintal_inr": 30.0,
            "mandi_charges_pct": 1.5,
            "wastage_pct": 2.0,
            "baseline_price_inr_quintal": 2275.0
        },
        "description": "Primary winter staple across the Gangetic plains of South and North-West Bihar."
    },
    "Paddy": {
        "id": "paddy",
        "name": "Paddy (Rice)",
        "name_hi": "धान",
        "category": "Cereal",
        "season": "Kharif",
        "major_districts": ["Rohtas", "Kaimur", "Bhojpur", "Patna", "West Champaran"],
        "duration_days": 135,
        "sowing_window": "Jun 15 - Jul 20",
        "harvest_window": "Nov 01 - Dec 15",
        "benchmarks_per_acre": {
            "yield_quintals": 22.0,
            "seed_cost_inr": 1400.0,
            "fertilizer_cost_inr": 3100.0,
            "pesticide_cost_inr": 1200.0,
            "organic_manure_cost_inr": 1100.0,
            "labour_cost_inr": 5800.0,
            "irrigation_cost_inr": 2800.0,
            "machinery_cost_inr": 3000.0,
            "packaging_cost_per_quintal_inr": 30.0,
            "mandi_charges_pct": 1.5,
            "wastage_pct": 2.5,
            "baseline_price_inr_quintal": 2300.0
        },
        "description": "Dominant monsoon cereal crop; Rohtas and Bhojpur are known as the rice bowls of Bihar."
    },
    "Potato": {
        "id": "potato",
        "name": "Potato",
        "name_hi": "आलू",
        "category": "Vegetable / Tuber",
        "season": "Rabi",
        "major_districts": ["Nalanda", "Patna", "Vaishali", "Samastipur", "Gaya"],
        "duration_days": 95,
        "sowing_window": "Oct 20 - Nov 15",
        "harvest_window": "Jan 20 - Mar 05",
        "benchmarks_per_acre": {
            "yield_quintals": 105.0,
            "seed_cost_inr": 12500.0,
            "fertilizer_cost_inr": 4800.0,
            "pesticide_cost_inr": 2200.0,
            "organic_manure_cost_inr": 2500.0,
            "labour_cost_inr": 6800.0,
            "irrigation_cost_inr": 3000.0,
            "machinery_cost_inr": 3800.0,
            "packaging_cost_per_quintal_inr": 45.0,
            "mandi_charges_pct": 2.0,
            "wastage_pct": 6.0,
            "baseline_price_inr_quintal": 1280.0
        },
        "description": "High-value commercial vegetable crop with extensive cold storage networks in Nalanda (Bihar Sharif) and Patna."
    },
    "Onion": {
        "id": "onion",
        "name": "Onion",
        "name_hi": "प्याज",
        "category": "Vegetable",
        "season": "Rabi / Kharif",
        "major_districts": ["Nalanda", "Patna", "Begusarai", "Bhagalpur"],
        "duration_days": 115,
        "sowing_window": "Nov 01 - Dec 15",
        "harvest_window": "Apr 01 - May 15",
        "benchmarks_per_acre": {
            "yield_quintals": 90.0,
            "seed_cost_inr": 4200.0,
            "fertilizer_cost_inr": 4500.0,
            "pesticide_cost_inr": 2100.0,
            "organic_manure_cost_inr": 2200.0,
            "labour_cost_inr": 7400.0,
            "irrigation_cost_inr": 3200.0,
            "machinery_cost_inr": 2600.0,
            "packaging_cost_per_quintal_inr": 40.0,
            "mandi_charges_pct": 2.0,
            "wastage_pct": 8.0,
            "baseline_price_inr_quintal": 1850.0
        },
        "description": "Crucial horticulture commodity with seasonal price surges during pre-monsoon storage periods."
    },
    "Tomato": {
        "id": "tomato",
        "name": "Tomato",
        "name_hi": "टमाटर",
        "category": "Vegetable",
        "season": "Rabi / Zaid",
        "major_districts": ["Vaishali", "Muzaffarpur", "Samastipur", "Patna"],
        "duration_days": 90,
        "sowing_window": "Sep 15 - Oct 25",
        "harvest_window": "Dec 15 - Mar 10",
        "benchmarks_per_acre": {
            "yield_quintals": 120.0,
            "seed_cost_inr": 3800.0,
            "fertilizer_cost_inr": 5100.0,
            "pesticide_cost_inr": 3400.0,
            "organic_manure_cost_inr": 2600.0,
            "labour_cost_inr": 8200.0,
            "irrigation_cost_inr": 3400.0,
            "machinery_cost_inr": 2400.0,
            "packaging_cost_per_quintal_inr": 60.0,
            "mandi_charges_pct": 2.0,
            "wastage_pct": 12.0,
            "baseline_price_inr_quintal": 1650.0
        },
        "description": "High-yield perishable vegetable with high sensitivity to transit distance and immediate market realization."
    },
    "Mustard": {
        "id": "mustard",
        "name": "Mustard (Rai)",
        "name_hi": "सरसों / राई",
        "category": "Oilseed",
        "season": "Rabi",
        "major_districts": ["Begusarai", "Khagaria", "Samastipur", "Patna"],
        "duration_days": 110,
        "sowing_window": "Oct 01 - Oct 31",
        "harvest_window": "Feb 15 - Mar 15",
        "benchmarks_per_acre": {
            "yield_quintals": 7.5,
            "seed_cost_inr": 900.0,
            "fertilizer_cost_inr": 2400.0,
            "pesticide_cost_inr": 1100.0,
            "organic_manure_cost_inr": 1000.0,
            "labour_cost_inr": 3600.0,
            "irrigation_cost_inr": 1800.0,
            "machinery_cost_inr": 2200.0,
            "packaging_cost_per_quintal_inr": 35.0,
            "mandi_charges_pct": 1.5,
            "wastage_pct": 1.5,
            "baseline_price_inr_quintal": 5400.0
        },
        "description": "Essential rabi oilseed; low water requirement and strong local crushing mill demand."
    },
    "Gram": {
        "id": "gram",
        "name": "Gram (Chana)",
        "name_hi": "चना",
        "category": "Pulse",
        "season": "Rabi",
        "major_districts": ["Patna (Tal areas)", "Nalanda", "Bhojpur", "Gaya"],
        "duration_days": 125,
        "sowing_window": "Oct 20 - Nov 15",
        "harvest_window": "Mar 10 - Apr 10",
        "benchmarks_per_acre": {
            "yield_quintals": 7.0,
            "seed_cost_inr": 1800.0,
            "fertilizer_cost_inr": 1600.0,
            "pesticide_cost_inr": 1200.0,
            "organic_manure_cost_inr": 900.0,
            "labour_cost_inr": 3400.0,
            "irrigation_cost_inr": 1200.0,
            "machinery_cost_inr": 2000.0,
            "packaging_cost_per_quintal_inr": 30.0,
            "mandi_charges_pct": 1.5,
            "wastage_pct": 2.0,
            "baseline_price_inr_quintal": 5800.0
        },
        "description": "Major pulse grown in the Mokama Tal and alluvial plains of South Bihar."
    },
    "Cauliflower": {
        "id": "cauliflower",
        "name": "Cauliflower",
        "name_hi": "फूलगोभी",
        "category": "Vegetable",
        "season": "Rabi / Early Winter",
        "major_districts": ["Vaishali", "Muzaffarpur", "Patna", "Samastipur"],
        "duration_days": 80,
        "sowing_window": "Aug 15 - Oct 15",
        "harvest_window": "Nov 15 - Feb 15",
        "benchmarks_per_acre": {
            "yield_quintals": 85.0,
            "seed_cost_inr": 3200.0,
            "fertilizer_cost_inr": 4200.0,
            "pesticide_cost_inr": 2800.0,
            "organic_manure_cost_inr": 2000.0,
            "labour_cost_inr": 6200.0,
            "irrigation_cost_inr": 2600.0,
            "machinery_cost_inr": 2200.0,
            "packaging_cost_per_quintal_inr": 50.0,
            "mandi_charges_pct": 2.0,
            "wastage_pct": 10.0,
            "baseline_price_inr_quintal": 1450.0
        },
        "description": "Prominent winter cash vegetable in North and Central Bihar river belts."
    }
}

def get_crop_by_name(crop_name: str) -> Optional[Dict[str, Any]]:
    clean_name = crop_name.strip().lower()
    for key, data in BIHAR_CROPS.items():
        if key.lower() == clean_name or data["name_hi"].lower() == clean_name or data["id"].lower() == clean_name:
            return data
    # partial matching
    for key, data in BIHAR_CROPS.items():
        if clean_name in key.lower() or clean_name in data["name"].lower():
            return data
    return None

def list_all_crops() -> List[Dict[str, Any]]:
    return list(BIHAR_CROPS.values())
