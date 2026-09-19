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