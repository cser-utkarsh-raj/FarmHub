from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
import pandas as pd
from backend.ml.core import FEATURES,HORIZONS,build_supervised,clean_market_data,make_baseline,make_model,metrics

def run_backtest(raw_path:str,output_path:str,folds:int=3)->dict:
    clean=clean_market_data(pd.read_csv(raw_path)); data=build_supervised(clean,HORIZONS).sort_values("target_date").reset_index(drop=True); dates=data.target_date.drop_duplicates().sort_values().tolist(); results=[]
    for i in range(1,folds+1):
        train_end_idx=int(len(dates)*(0.55+0.10*(i-1))); test_end_idx=int(len(dates)*(0.65+0.10*(i-1)))
        if test_end_idx>=len(dates): continue
        train_end=dates[train_end_idx]; test_end=dates[test_end_idx]; train=data[data.target_date<train_end]; test=data[(data.target_date>=train_end)&(data.target_date<test_end)]
        if len(train)<100 or len(test)<20: continue
        model=make_model(); model.fit(train[FEATURES],train.target_price); pred=model.predict(test[FEATURES]); row={"fold":i,"train_until":str(train_end.date()),"test_until":str(test_end.date()),"rows":len(test),"ml":metrics(test.target_price.to_numpy(),pred)}; baseline=make_baseline(train,test); valid=np.isfinite(baseline); row["baseline"]=metrics(test.loc[valid,"target_price"].to_numpy(),baseline[valid]) if valid.any() else {}; results.append(row)
    if len(results)<2: raise RuntimeError("Could not produce at least two chronological backtest folds")
    report={"folds":results,"model_version":"farmhub-global-hgb-v1"}; Path(output_path).parent.mkdir(parents=True,exist_ok=True); Path(output_path).write_text(json.dumps(report,indent=2),encoding="utf-8"); return report
if __name__=="__main__":
    p=argparse.ArgumentParser(); p.add_argument("--input",default="backend/ml/data/raw/bihar_market_prices.csv"); p.add_argument("--output",default="backend/ml/reports/backtest.json"); args=p.parse_args(); print(json.dumps(run_backtest(args.input,args.output),indent=2))
