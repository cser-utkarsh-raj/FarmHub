from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from hashlib import sha256

def digest_bytes(data: bytes) -> str:
    return sha256(data).hexdigest()


from pathlib import Path

@dataclass(frozen=True)
class Provenance:
    source: str
    source_resource_id: str
    fetched_at: str
    row_count: int
    date_min: str
    date_max: str
    markets: list[str]
    districts: list[str]
    commodities: list[str]
    content_sha256: str

    def to_dict(self) -> dict:
        return asdict(self)

    def save(self, path: str | Path) -> None:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(self.to_dict(), indent=2), encoding="utf-8")

    @classmethod
    def load(cls, path: str | Path) -> "Provenance":
        return cls(**json.loads(Path(path).read_text(encoding="utf-8")))
import pandas as pd

def build_provenance(df: pd.DataFrame, data_path: str | Path, *, source: str, resource_id: str) -> Provenance:
    if df.empty:
        raise ValueError("Cannot create provenance for an empty dataset")
    time_column = next((c for c in ("date", "arrival_date", "crop_year", "year", "Year") if c in df.columns), None)
    if time_column is None:
        raise ValueError("Could not determine a time column for provenance")
    if time_column.lower() in {"crop_year", "year"} or time_column == "Year":
        values = pd.to_numeric(df[time_column], errors="coerce").dropna()
        date_min = str(int(values.min())) if not values.empty else ""
        date_max = str(int(values.max())) if not values.empty else ""
    else:
        values = pd.to_datetime(df[time_column], errors="coerce").dropna()
        date_min = str(values.min().date()) if not values.empty else ""
        date_max = str(values.max().date()) if not values.empty else ""
    def vals(column: str) -> list[str]:
        if column not in df.columns:
            return []
        return sorted({str(v).strip() for v in df[column].dropna() if str(v).strip()})
    return Provenance(source, resource_id, datetime.now(timezone.utc).isoformat(), int(len(df)), date_min, date_max, vals("market"), vals("district"), vals("commodity"), digest_bytes(Path(data_path).read_bytes()))
