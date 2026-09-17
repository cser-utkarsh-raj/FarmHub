from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
import pandas as pd
from backend.ml.core import Artifact, FEATURES, HORIZONS, build_supervised, clean_market_data, make_baseline, make_model, metrics

def conformal_q(residuals:np.ndarray,coverage:float=0.90)->float:
    residuals=np.asarray(residuals,dtype=float); residuals=residuals[np.isfinite(residuals)]
    if len(residuals)<30: raise RuntimeError("Not enough calibration residuals for a reliable prediction interval")
    return float(np.quantile(np.abs(residuals),coverage,method="higher"))

def train(raw_path:str,artifact_path:str,report_path:str)->dict:
    clean=clean_market_data(pd.read_csv(raw_path)); supervised=build_supervised(clean,HORIZONS)
    if supervised.empty or len(supervised)<500: raise RuntimeError(f"Insufficient supervised observations: {len(supervised)}")
    supervised=supervised.sort_values("target_date").reset_index(drop=True); dates=supervised["target_date"].drop_duplicates().sort_values()
    train_cut=dates.iloc[int(len(dates)*0.65)]; calibration_cut=dates.iloc[int(len(dates)*0.80)]
    train_df=supervised[supervised.target_date<train_cut].copy(); calibration_df=supervised[(supervised.target_date>=train_cut)&(supervised.target_date<calibration_cut)].copy(); test_df=supervised[supervised.target_date>=calibration_cut].copy()
    if min(len(train_df),len(calibration_df),len(test_df))<30: raise RuntimeError("Chronological train/calibration/test split is too small")
    model=make_model(); model.fit(train_df[FEATURES],train_df.target_price)
    cal_pred=model.predict(calibration_df[FEATURES]); calibration_df["abs_residual"]=np.abs(calibration_df.target_price.to_numpy()-cal_pred)
    intervals={}
    for horizon in HORIZONS:
        residuals=calibration_df.loc[calibration_df.horizon_days.between(max(1,horizon-2),horizon+max(2,int(horizon*.08))),"abs_residual"].to_numpy()
        if len(residuals)<30: residuals=calibration_df.abs_residual.to_numpy()
        intervals[str(horizon)]=conformal_q(residuals)
    pred=model.predict(test_df[FEATURES]); test_df["prediction"]=pred; test_df["interval_q90"]=test_df.horizon_days.map(lambda h:intervals[str(min(HORIZONS,key=lambda x:abs(x-int(h))))]); test_df["lower"]=np.maximum(0,test_df.prediction-test_df.interval_q90); test_df["upper"]=test_df.prediction+test_df.interval_q90
    ml_metrics=metrics(test_df.target_price.to_numpy(),pred); ml_metrics["prediction_interval_coverage"]=float(((test_df.target_price>=test_df.lower)&(test_df.target_price<=test_df.upper)).mean()*100)
    baseline=make_baseline(train_df,test_df); valid=np.isfinite(baseline); baseline_metrics=metrics(test_df.loc[valid,"target_price"].to_numpy(),baseline[valid]) if valid.any() else {}
    report={"model_version":"farmhub-global-hgb-v1","trained_until":str(train_df.target_date.max().date()),"calibration_from":str(calibration_df.target_date.min().date()),"test_from":str(test_df.target_date.min().date()),"train_rows":len(train_df),"calibration_rows":len(calibration_df),"test_rows":len(test_df),"series":int(clean.groupby(["district","market","commodity","variety"]).ngroups),"ml":ml_metrics,"seasonal_naive_last_observation":baseline_metrics,"conformal_q90_by_horizon":intervals,"data_source":"data.gov.in resource 9ef84268-d588-465a-a308-a864a43d0070 (AGMARKNET-generated mandi observations)"}
    Artifact(model=model,feature_columns=FEATURES,trained_until=report["trained_until"],horizons=list(HORIZONS),metrics=report).save(artifact_path)
    Path(report_path).parent.mkdir(parents=True,exist_ok=True); Path(report_path).write_text(json.dumps(report,indent=2),encoding="utf-8"); return report

def main()->None:
    p=argparse.ArgumentParser(); p.add_argument("--input",default="backend/ml/data/raw/bihar_market_prices.csv"); p.add_argument("--artifact",default="backend/ml/models/price_forecaster.joblib"); p.add_argument("--report",default="backend/ml/reports/latest.json"); args=p.parse_args(); print(json.dumps(train(args.input,args.artifact,args.report),indent=2))
if __name__=="__main__": main()
