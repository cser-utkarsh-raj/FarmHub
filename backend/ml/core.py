from __future__ import annotations

import joblib
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OrdinalEncoder

RAW_COLUMNS = ["state", "district", "market", "commodity", "variety", "grade", "date", "min_price", "max_price", "modal_price"]
GROUP_COLUMNS = ["state", "district", "market", "commodity", "variety"]
HORIZONS = (7, 30, 90)
ALIASES = {"state":["state","State"],"district":["district","District"],"market":["market","Market","market_name","Market Name"],"commodity":["commodity","Commodity"],"variety":["variety","Variety"],"grade":["grade","Grade"],"date":["date","Date","arrival_date","Arrival_Date","Arrival Date","record_date","Record_Date","record date"],"min_price":["min_price","Min_Price","Min Price"],"max_price":["max_price","Max_Price","Max Price"],"modal_price":["modal_price","Modal_Price","Modal Price"]}

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame(index=df.index)
    lowered = {str(c).strip().lower().replace(" ", "_"): c for c in df.columns}
    for canonical, candidates in ALIASES.items():
        found = next((lowered.get(c.strip().lower().replace(" ", "_")) for c in candidates if c.strip().lower().replace(" ", "_") in lowered), None)
        if found is not None: out[canonical] = df[found]
    missing = [c for c in RAW_COLUMNS if c not in out.columns and c not in {"grade"}]
    if missing: raise ValueError(f"Missing required market fields: {missing}")
    if "grade" not in out: out["grade"] = ""
    return out[RAW_COLUMNS]

def clean_market_data(df: pd.DataFrame) -> pd.DataFrame:
    df = normalize_columns(df).copy()
    for col in ["state","district","market","commodity","variety","grade"]:
        df[col] = df[col].fillna("").astype(str).str.strip().str.replace(r"\s+", " ", regex=True)
    for col in ["min_price","max_price","modal_price"]:
        df[col] = pd.to_numeric(df[col].astype(str).str.replace(",", "", regex=False).str.extract(r"([-+]?\d+(?:\.\d+)?)")[0], errors="coerce")
    df["date"] = pd.to_datetime(df["date"], errors="coerce", format="mixed").dt.normalize()
    df = df.dropna(subset=["date","modal_price"])
    df = df[df["modal_price"] > 0]
    df = df[df["min_price"].isna() | (df["min_price"] >= 0)]
    df = df[df["max_price"].isna() | (df["max_price"] >= 0)]
    df["min_price"] = df["min_price"].fillna(df["modal_price"])
    df["max_price"] = df["max_price"].fillna(df["modal_price"])
    df["variety"] = df["variety"].replace("", "UNKNOWN")
    df["grade"] = df["grade"].replace("", "UNKNOWN")
    return df.drop_duplicates(subset=GROUP_COLUMNS + ["grade","date"], keep="last").sort_values(GROUP_COLUMNS + ["date"]).reset_index(drop=True)

def add_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(GROUP_COLUMNS + ["date"]).copy()
    g = df.groupby(GROUP_COLUMNS, sort=False, group_keys=False)
    for lag in (1,2,7,14,30): df[f"lag_{lag}"] = g["modal_price"].shift(lag)
    shifted = g["modal_price"].shift(1)
    for window in (7,14,30):
        rg = shifted.groupby([df[c] for c in GROUP_COLUMNS])
        df[f"rolling_mean_{window}"] = rg.transform(lambda s: s.rolling(window, min_periods=max(3,window//2)).mean())
        df[f"rolling_std_{window}"] = rg.transform(lambda s: s.rolling(window, min_periods=max(3,window//2)).std())
    df["price_spread"] = df["max_price"] - df["min_price"]
    df["month"] = df["date"].dt.month.astype(int)
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)
    df["day_of_year"] = df["date"].dt.dayofyear.astype(int)
    return df

def build_supervised(df: pd.DataFrame, horizons: Iterable[int] = HORIZONS) -> pd.DataFrame:
    base = add_features(df); rows = []
    for horizon in horizons:
        for _, group in base.groupby(GROUP_COLUMNS, sort=False):
            group = group.sort_values("date")
            target = group[["date","modal_price"]].rename(columns={"date":"target_date","modal_price":"target_price"}).sort_values("target_date")
            anchors = group.copy(); anchors["desired_target_date"] = anchors["date"] + pd.to_timedelta(horizon, unit="D")
            matched = pd.merge_asof(anchors.sort_values("desired_target_date"), target, left_on="desired_target_date", right_on="target_date", direction="forward", tolerance=pd.Timedelta(days=max(2,int(horizon*0.08))))
            matched = matched[matched["target_date"] > matched["date"]].copy()
            matched["horizon_days"] = (matched["target_date"] - matched["date"]).dt.days
            matched["target_month"] = matched["target_date"].dt.month.astype(int)
            matched["target_week_of_year"] = matched["target_date"].dt.isocalendar().week.astype(int)
            matched["target_day_of_year"] = matched["target_date"].dt.dayofyear.astype(int)
            rows.append(matched)
    return pd.concat(rows, ignore_index=True) if rows else pd.DataFrame()

NUMERIC_FEATURES=["lag_1","lag_2","lag_7","lag_14","lag_30","rolling_mean_7","rolling_std_7","rolling_mean_14","rolling_std_14","rolling_mean_30","rolling_std_30","price_spread","month","week_of_year","day_of_year","horizon_days","target_month","target_week_of_year","target_day_of_year"]
CATEGORICAL_FEATURES=["district","market","commodity","variety"]
FEATURES=CATEGORICAL_FEATURES+NUMERIC_FEATURES

def make_model() -> Pipeline:
    prep=ColumnTransformer([("cat",Pipeline([("impute",SimpleImputer(strategy="most_frequent")),("ordinal",OrdinalEncoder(handle_unknown="use_encoded_value",unknown_value=-1))]),CATEGORICAL_FEATURES),("num",SimpleImputer(strategy="median"),NUMERIC_FEATURES)],remainder="drop")
    model=HistGradientBoostingRegressor(max_iter=300,learning_rate=0.05,max_leaf_nodes=31,l2_regularization=1.0,random_state=42)
    return Pipeline([("prep",prep),("model",model)])

def make_baseline(train: pd.DataFrame, test: pd.DataFrame) -> np.ndarray:
    return test["lag_1"].to_numpy(dtype=float)

def metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    mae=mean_absolute_error(y_true,y_pred); rmse=mean_squared_error(y_true,y_pred)**0.5; denom=np.maximum(np.abs(y_true),1.0)
    return {"mae":float(mae),"rmse":float(rmse),"mape_percent":float(np.mean(np.abs((y_true-y_pred)/denom))*100),"directional_accuracy_percent":float(np.mean(np.sign(np.diff(y_true))==np.sign(np.diff(y_pred)))*100) if len(y_true)>1 else float("nan")}

@dataclass
class Artifact:
    model: Pipeline
    feature_columns: list[str]
    trained_until: str
    horizons: list[int]
    metrics: dict
    def save(self,path:str|Path)->None:
        path=Path(path); path.parent.mkdir(parents=True,exist_ok=True); joblib.dump(self,path)
    @staticmethod
    def load(path:str|Path)->"Artifact": return joblib.load(path)
