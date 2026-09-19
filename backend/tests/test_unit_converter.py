import pytest
from backend.app.services.unit_converter import (
    to_acres,
    from_acres,
    convert_land,
    to_quintals,
    price_per_quintal
)

def test_bihar_bigha_conversion():
    # In standard Bihar revenue measurement: 1 Bigha = 0.625 Acre (20 Katha)
    assert to_acres(1.0, "bigha") == 0.625
    assert to_acres(4.0, "bigha") == 2.5
    assert from_acres(2.5, "bigha") == 4.0

def test_bihar_katha_conversion():
    # 1 Bigha = 20 Katha -> 1 Katha = 0.625 / 20 = 0.03125 Acre
    assert to_acres(20.0, "katha") == 0.625
    assert convert_land(20.0, "katha", "bigha") == pytest.approx(1.0)

def test_hectare_and_acre():
    assert to_acres(1.0, "acre") == 1.0
    assert to_acres(1.0, "hectare") == 2.47105

def test_negative_land_raises():
    with pytest.raises(ValueError):
        to_acres(-1.0, "bigha")

def test_weight_conversions():
    assert to_quintals(100.0, "kg") == 1.0
    assert to_quintals(1.0, "quintal") == 1.0
    assert to_quintals(1.0, "tonne") == 10.0
    assert to_quintals(1.0, "maund") == 0.4  # 1 Maund = 40kg = 0.4 quintal

def test_price_conversions():
    assert price_per_quintal(25.0, "INR/kg") == 2500.0
    assert price_per_quintal(2180.0, "INR/quintal") == 2180.0
