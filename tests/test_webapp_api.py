"""API tests for the FastAPI webapp (filesystem-backed read layer)."""

from __future__ import annotations

import csv
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from src.webapp.config import get_data_dir
from src.webapp.main import app


def _write_well_csv(path: Path, rows: list[dict]) -> None:
    fieldnames = [
        "timestamp",
        "absorbance_od600",
        "cell_concentration_cells_per_ml",
        "parent_well",
        "consider_data",
    ]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def _write_minimal_iteration(base: Path, iteration_id: str = "iter_001") -> None:
    """Create one iteration with metrics, design mapping, and one well CSV."""
    iter_dir = base / iteration_id
    (iter_dir / "analysis").mkdir(parents=True)
    (iter_dir / "input").mkdir(parents=True)
    (iter_dir / "output").mkdir(parents=True)

    metrics = {
        "iteration_id": iteration_id,
        "results": [
            {
                "well": "A1",
                "parent_well": "stock",
                "params": {"cell_volume_uL": 40.0},
                "growth_rate": 0.05,
                "doubling_time_hours": 13.86,
                "r_squared": 0.99,
                "max_od": 0.5,
                "n_datapoints": 10,
                "time_range_hours": 5.0,
            },
            {
                "well": "A2",
                "parent_well": "stock",
                "params": {"cell_volume_uL": 35.0},
                "growth_rate": 0.03,
                "doubling_time_hours": 23.1,
                "r_squared": 0.97,
                "max_od": 0.4,
                "n_datapoints": 10,
                "time_range_hours": 5.0,
            },
        ],
    }
    (iter_dir / "analysis" / "growth_metrics.json").write_text(json.dumps(metrics, indent=2))

    design = {
        "designs": [
            {"well": "A1", "params": {"cell_volume_uL": 40.0}},
            {"well": "A2", "params": {"cell_volume_uL": 35.0}},
        ]
    }
    (iter_dir / "input" / "well_to_design_mapping.json").write_text(json.dumps(design))

    rows = [
        {
            "timestamp": "2025-10-25T18:00:00.000000-0800",
            "absorbance_od600": "0.100000",
            "cell_concentration_cells_per_ml": "100000000",
            "parent_well": "stock",
            "consider_data": "True",
        },
        {
            "timestamp": "2025-10-25T18:15:00.000000-0800",
            "absorbance_od600": "0.150000",
            "cell_concentration_cells_per_ml": "150000000",
            "parent_well": "stock",
            "consider_data": "True",
        },
    ]
    _write_well_csv(iter_dir / "output" / "well_A1_absorbance.csv", rows)


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    app.dependency_overrides[get_data_dir] = lambda: tmp_path
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


def test_health() -> None:
    with TestClient(app) as c:
        r = c.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_get_data_dir_env_override(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    custom = tmp_path / "custom_data"
    custom.mkdir()
    monkeypatch.setenv("WEBAPP_DATA_DIR", str(custom))
    assert get_data_dir() == custom


def test_list_iterations_empty(client: TestClient) -> None:
    r = client.get("/api/iterations")
    assert r.status_code == 200
    assert r.json() == []


def test_list_iterations_data_dir_missing(tmp_path: Path) -> None:
    missing = tmp_path / "does_not_exist"
    assert not missing.exists()
    app.dependency_overrides[get_data_dir] = lambda: missing
    try:
        with TestClient(app) as c:
            r = c.get("/api/iterations")
    finally:
        app.dependency_overrides.clear()
    assert r.status_code == 404
    assert "not found" in r.json()["detail"].lower()


def test_list_iterations_one_iteration(client: TestClient, tmp_path: Path) -> None:
    _write_minimal_iteration(tmp_path)
    r = client.get("/api/iterations")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["iteration_id"] == "iter_001"
    assert data[0]["best_well"] == "A1"
    assert data[0]["well_count"] == 2


def test_get_iteration(client: TestClient, tmp_path: Path) -> None:
    _write_minimal_iteration(tmp_path)
    r = client.get("/api/iterations/iter_001")
    assert r.status_code == 200
    body = r.json()
    assert body["iteration_id"] == "iter_001"
    assert len(body["results"]) == 2


def test_get_iteration_not_found(client: TestClient) -> None:
    r = client.get("/api/iterations/iter_999")
    assert r.status_code == 404


def test_get_design_mapping(client: TestClient, tmp_path: Path) -> None:
    _write_minimal_iteration(tmp_path)
    r = client.get("/api/iterations/iter_001/design-mapping")
    assert r.status_code == 200
    assert len(r.json()["designs"]) == 2


def test_get_design_mapping_missing_file(client: TestClient, tmp_path: Path) -> None:
    _write_minimal_iteration(tmp_path)
    mapping = tmp_path / "iter_001" / "input" / "well_to_design_mapping.json"
    mapping.unlink()
    r = client.get("/api/iterations/iter_001/design-mapping")
    assert r.status_code == 404


def test_well_timeseries(client: TestClient, tmp_path: Path) -> None:
    _write_minimal_iteration(tmp_path)
    r = client.get("/api/iterations/iter_001/wells/A1/timeseries")
    assert r.status_code == 200
    pts = r.json()
    assert len(pts) == 2
    assert "elapsed_hours" in pts[0]
    assert "od600" in pts[0]


def test_well_timeseries_not_found(client: TestClient, tmp_path: Path) -> None:
    _write_minimal_iteration(tmp_path)
    r = client.get("/api/iterations/iter_001/wells/B9/timeseries")
    assert r.status_code == 404
