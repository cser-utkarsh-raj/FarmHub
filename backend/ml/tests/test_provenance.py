"""TEST FIXTURES for provenance verification."""
import pandas as pd
import pytest

from backend.ml.provenance import build_provenance, verify_provenance


def test_provenance_matches_exact_file(tmp_path):
    path = tmp_path / "prices.csv"
    pd.DataFrame({
        "date": ["2026-09-18"],
        "market": ["Gulabbagh"],
        "district": ["Purnia"],
        "commodity": ["Maize"],
        "modal_price": [2100],
    }).to_csv(path, index=False)

    provenance = build_provenance(
        pd.read_csv(path),
        path,
        source="data.gov.in",
        resource_id="9ef84268-d588-465a-a308-a864a43d0070",
    )
    prov_path = tmp_path / "provenance.json"
    provenance.save(prov_path)

    verified = verify_provenance(
        path,
        prov_path,
        expected_resource_id="9ef84268-d588-465a-a308-a864a43d0070",
    )
    assert verified.row_count == 1


def test_changed_file_is_rejected(tmp_path):
    path = tmp_path / "prices.csv"
    pd.DataFrame({"date": ["2026-09-18"], "modal_price": [2100]}).to_csv(
        path, index=False
    )
    provenance = build_provenance(
        pd.read_csv(path),
        path,
        source="data.gov.in",
        resource_id="9ef84268-d588-465a-a308-a864a43d0070",
    )
    prov_path = tmp_path / "provenance.json"
    provenance.save(prov_path)

    path.write_text(path.read_text(encoding="utf-8") + "\n", encoding="utf-8")
    with pytest.raises(RuntimeError, match="digest"):
        verify_provenance(
            path,
            prov_path,
            expected_resource_id="9ef84268-d588-465a-a308-a864a43d0070",
        )
