import numpy as np
import pandas as pd
from backend.ml.core import add_features, build_supervised

def make_df(n=140):
    dates=pd.date_range("2024-01-01",periods=n,freq="D")
    return pd.DataFrame({"state":"Bihar","district":"Patna","market":"Test Mandi","commodity":"Potato","variety":"General","grade":"FAQ","date":dates,"min_price":1000+np.arange(n),"max_price":1100+np.arange(n),"modal_price":1050+np.arange(n)})

def test_lag_is_previous_observation():
    df=add_features(make_df()); assert pd.isna(df.iloc[0].lag_1); assert df.iloc[10].lag_1==df.iloc[9].modal_price

def test_rolling_uses_only_history():
    df=add_features(make_df()); assert df.iloc[10].rolling_mean_7==df.iloc[3:10].modal_price.mean()

def test_supervised_target_is_future():
    df=build_supervised(make_df()); assert (pd.to_datetime(df.target_date)>pd.to_datetime(df.date)).all(); assert set(df.horizon_days.unique()).issubset({7,30,90})
