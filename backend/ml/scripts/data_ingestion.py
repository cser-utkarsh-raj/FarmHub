from __future__ import annotations
import argparse, json, os
from pathlib import Path
from typing import Any
import pandas as pd
import requests
from backend.ml.core import clean_market_data

RESOURCE_URL="https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

def _records(payload:Any)->list[dict]:
    if isinstance(payload,list): return payload
    if isinstance(payload,dict):
        for key in ("records","data","results"):
            if isinstance(payload.get(key),list): return payload[key]
    raise ValueError("Unexpected data.gov.in response shape")

def fetch_bihar(api_key:str,commodities:list[str]|None=None,limit:int=1000,max_pages:int=1000)->pd.DataFrame:
    if not api_key: raise RuntimeError("DATA_GOV_IN_API_KEY is required")
    all_rows=[]; session=requests.Session()
    for commodity in commodities or [None]:
        offset=0
        for _ in range(max_pages):
            params={"api-key":api_key,"format":"json","limit":limit,"offset":offset,"filters[state.keyword]":"Bihar"}
            if commodity: params["filters[commodity]"]=commodity
            response=session.get(RESOURCE_URL,params=params,timeout=30); response.raise_for_status()
            records=_records(response.json())
            if not records: break
            all_rows.extend(records)
            if len(records)<limit: break
            offset+=limit
    return clean_market_data(pd.DataFrame(all_rows)) if all_rows else pd.DataFrame()

def main()->None:
    p=argparse.ArgumentParser(); p.add_argument("--commodity",action="append",dest="commodities"); p.add_argument("--output",default="backend/ml/data/raw/bihar_market_prices.csv"); args=p.parse_args()
    df=fetch_bihar(os.getenv("DATA_GOV_IN_API_KEY",""),args.commodities)
    if df.empty: raise SystemExit("No Bihar observations fetched")
    path=Path(args.output); path.parent.mkdir(parents=True,exist_ok=True); df.to_csv(path,index=False)
    print(json.dumps({"rows":len(df),"from":str(df.date.min().date()),"to":str(df.date.max().date()),"markets":int(df.market.nunique()),"commodities":int(df.commodity.nunique())},indent=2))
if __name__=="__main__": main()
