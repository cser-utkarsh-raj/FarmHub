import pytest
from backend.app.services.economics_engine import (
    calculate_crop_economics,
    EconomicsInput
)

def test_crop_economics_default_benchmarks():
    payload = EconomicsInput(
        crop="Maize",
        land_area=4.0,
        local_land_unit="bigha"
    )
    result = calculate_crop_economics(payload)

    # 4 Bigha = 2.5 Acres
    assert result.acres_equivalent == 2.5
    assert result.crop == "Maize"

    # Scenarios exist
    assert "conservative" in result.scenarios
    assert "expected" in result.scenarios
    assert "high-price" in result.scenarios

    exp = result.scenarios["expected"]
    cons = result.scenarios["conservative"]
    high = result.scenarios["high-price"]

    # Conservative net profit should be less than expected, which is less than high-price
    assert cons.net_profit_inr < exp.net_profit_inr < high.net_profit_inr

    # Benchmark source tagging
    assert result.cost_breakdown["seeds"].source == "ICAR_BAU_ESTIMATE"
    assert result.cost_breakdown["labour"].source == "ICAR_BAU_ESTIMATE"

def test_crop_economics_user_customization():
    payload = EconomicsInput(
        crop="Potato",
        land_area=2.0,
        local_land_unit="acre",
        seed_cost_per_acre=15000.0,
        expected_selling_price_quintal=1400.0
    )
    result = calculate_crop_economics(payload)

    assert result.acres_equivalent == 2.0
    assert result.cost_breakdown["seeds"].source == "USER_CUSTOMIZED"
    assert result.cost_breakdown["seeds"].amount_inr == 30000.0  # 15000 * 2 acres
    assert result.cost_breakdown["labour"].source == "ICAR_BAU_ESTIMATE"

def test_invalid_crop_raises():
    payload = EconomicsInput(
        crop="Dragonfruit",
        land_area=1.0,
        local_land_unit="acre"
    )
    with pytest.raises(ValueError, match="Unknown crop"):
        calculate_crop_economics(payload)
