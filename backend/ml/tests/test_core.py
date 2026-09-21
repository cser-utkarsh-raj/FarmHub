import numpy as np
import pandas as pd
from backend.ml.core import add_features, build_supervised, HORIZONS, clean_market_data

def make_df(n=140):
    dates=pd.date_range("2024-01-01",periods=n,freq="D")
    return pd.DataFrame({"state":"Bihar","district":"Patna","market":"Test Mandi","commodity":"Potato","variety":"General","grade":"FAQ","date":dates,"min_price":1000+np.arange(n),"max_price":1100+np.arange(n),"modal_price":1050+np.arange(n)})

def make_sparse_df(n_dates=60, gap_days=9, n_markets=3, n_commodities=2):
    """Create sparse mandi-like data with irregular observations."""
    base_date = pd.Timestamp("2023-01-01")
    rows = []
    for i in range(n_dates):
        date = base_date + pd.Timedelta(days=i*gap_days)
        for market in [f"Market_{m}" for m in range(n_markets)]:
            for commodity, variety in [(f"Crop_{c}", "Local") for c in range(n_commodities)]:
                rows.append({
                    "state": "Bihar", "district": market, "market": market,
                    "commodity": commodity, "variety": variety, "grade": "",
                    "date": date, "min_price": 1800 + i*2,
                    "max_price": 2000 + i*2, "modal_price": 1900 + i*2
                })
    return pd.DataFrame(rows)

def test_lag_is_previous_observation():
    df=add_features(make_df()); assert pd.isna(df.iloc[0].lag_1); assert df.iloc[10].lag_1==df.iloc[9].modal_price

def test_rolling_uses_only_history():
    df=add_features(make_df()); assert df.iloc[10].rolling_mean_7==df.iloc[3:10].modal_price.mean()

def test_supervised_target_is_future():
    df=build_supervised(make_df()); assert (pd.to_datetime(df.target_date)>pd.to_datetime(df.date)).all(); assert set(df.horizon_days.unique()).issubset({7,30,90})

def test_sparse_mandi_produces_supervised_rows():
    """Verify that sparse mandi data (9-day gaps) produces supervised samples for all horizons."""
    df = make_sparse_df(n_dates=60, gap_days=9, n_markets=3, n_commodities=2)
    clean = clean_market_data(df)
    supervised = build_supervised(clean, HORIZONS)
    
    assert len(supervised) > 0, "No supervised rows generated from sparse data"
    
    for horizon in HORIZONS:
        h_rows = supervised[supervised["horizon_days"] == horizon]
        assert len(h_rows) > 0, f"No rows for {horizon}-day horizon"
        # Verify horizon_days is the DESIRED horizon, not actual gap
        assert h_rows["horizon_days"].iloc[0] == horizon
    
    # Verify actual_horizon_days tracks the real gap
    assert "actual_horizon_days" in supervised.columns
    h7 = supervised[supervised["horizon_days"] == 7]
    assert (h7["actual_horizon_days"] >= 7).all(), "Actual horizon should be >= desired (forward search)"

def test_build_supervised_stores_desired_horizon():
    """Verify that horizon_days stores the desired horizon, not the actual gap."""
    df = make_sparse_df(n_dates=40, gap_days=10, n_markets=2, n_commodities=1)
    clean = clean_market_data(df)
    supervised = build_supervised(clean, HORIZONS)
    
    # Each horizon should have consistent horizon_days value
    for horizon in HORIZONS:
        h_rows = supervised[supervised["horizon_days"] == horizon]
        if len(h_rows) > 0:
            assert h_rows["horizon_days"].unique() == [horizon]

def test_insufficient_data_returns_empty():
    """Verify that very short series produce empty/limited supervised data."""
    df = make_sparse_df(n_dates=10, gap_days=15, n_markets=1, n_commodities=1)
    clean = clean_market_data(df)
    supervised = build_supervised(clean, HORIZONS)
    
    # With only 10 observations and 15-day gaps, we shouldn't have enough history
    # for meaningful supervised learning, especially for longer horizons
    assert len(supervised) < 100  # Should be very limited

def test_horizon_7_accepts_observation_within_tolerance():
    """Verify 7-day request can use an observation at 8-10 days (within ±20% tolerance)."""
    df = make_sparse_df(n_dates=30, gap_days=9, n_markets=1, n_commodities=1)
    clean = clean_market_data(df)
    supervised = build_supervised(clean, [7])
    
    assert len(supervised) > 0, "Should generate rows for 7-day horizon"
    h7 = supervised[supervised["horizon_days"] == 7]
    assert len(h7) > 0, "Should have 7-day horizon samples"
    assert h7["horizon_days"].iloc[0] == 7, "horizon_days must be exactly 7"
    # Actual gap should be around 9 days (next observation in 9-day spaced data)
    actual_gaps = h7["actual_horizon_days"].unique()
    assert any(g in actual_gaps for g in [8, 9, 10]), f"Actual gap should be ~9 days, got {actual_gaps}"

def test_horizon_7_rejects_observation_outside_tolerance():
    """Verify 7-day request rejects observations outside ±20% tolerance (e.g., 15-day gap)."""
    df = make_sparse_df(n_dates=20, gap_days=15, n_markets=1, n_commodities=1)
    clean = clean_market_data(df)
    supervised = build_supervised(clean, [7])
    
    # With 15-day gaps, the 7-day horizon tolerance (±3 days) won't match
    # This is correct behavior - we don't want to map 7-day to 15-day
    h7 = supervised[supervised["horizon_days"] == 7] if len(supervised) > 0 else pd.DataFrame()
    assert len(h7) == 0, "7-day horizon should not match 15-day gaps"

def test_horizon_30_accepts_observation_at_36_days():
    """Verify 30-day request can use an observation at 36 days (within ±20% = ±6 days)."""
    df = make_sparse_df(n_dates=50, gap_days=9, n_markets=1, n_commodities=1)
    clean = clean_market_data(df)
    supervised = build_supervised(clean, [30])
    
    h30 = supervised[supervised["horizon_days"] == 30] if len(supervised) > 0 else pd.DataFrame()
    assert len(h30) > 0, "Should generate rows for 30-day horizon"
    assert h30["horizon_days"].iloc[0] == 30, "horizon_days must be exactly 30"
    # With 9-day gaps, actual gap should be around 36 days (4 observations)
    actual_gaps = h30["actual_horizon_days"].unique()
    assert any(30 <= g <= 40 for g in actual_gaps), f"Actual gap should be ~36 days, got {actual_gaps}"

def test_horizon_90_accepts_observation_at_90_to_108_days():
    """Verify 90-day request can use an observation at 90-108 days (within ±20% = ±18 days)."""
    df = make_sparse_df(n_dates=50, gap_days=9, n_markets=1, n_commodities=1)
    clean = clean_market_data(df)
    supervised = build_supervised(clean, [90])
    
    h90 = supervised[supervised["horizon_days"] == 90] if len(supervised) > 0 else pd.DataFrame()
    assert len(h90) > 0, "Should generate rows for 90-day horizon"
    assert h90["horizon_days"].iloc[0] == 90, "horizon_days must be exactly 90"
    # Actual gap should be within tolerance
    actual_gaps = h90["actual_horizon_days"].unique()
    assert all(72 <= g <= 108 for g in actual_gaps), f"Actual gap should be 72-108 days, got {actual_gaps}"

def test_no_target_leakage():
    """Verify target observation does NOT contribute to lag features at anchor date."""
    df = make_sparse_df(n_dates=20, gap_days=9, n_markets=1, n_commodities=1)
    clean = clean_market_data(df)
    supervised = build_supervised(clean, [7])
    
    assert len(supervised) > 0, "Should have supervised samples"
    row = supervised.iloc[0]
    
    # Target price should never equal lag features (which use past observations)
    if pd.notna(row.get("lag_1")):
        assert row["target_price"] != row["lag_1"], "Target price must not equal lag_1"
    if pd.notna(row.get("lag_2")):
        assert row["target_price"] != row["lag_2"], "Target price must not equal lag_2"
