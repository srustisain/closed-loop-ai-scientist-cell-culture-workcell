"""Tests for the data parser module."""

import csv
import json
import math
from pathlib import Path

import numpy as np
import pytest

from src.parser.parser import fit_exponential_growth, load_od_data, run

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _write_well_csv(path: Path, rows: list[dict]) -> None:
    """Write a well absorbance CSV with the standard columns."""
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


def _write_design_mapping(path: Path, designs: list[dict]) -> None:
    """Write a well-to-design mapping JSON."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"designs": designs}, indent=2))


def _make_exponential_rows(
    growth_rate: float,
    od_start: float = 0.1,
    n_points: int = 20,
    interval_min: int = 15,
    parent_well: str = "stock",
    consider_data: bool = True,
) -> list[dict]:
    """Generate synthetic exponential growth CSV rows."""
    rows = []
    for i in range(n_points):
        elapsed_h = (i * interval_min) / 60.0
        od = od_start * math.exp(growth_rate * elapsed_h)
        ts = f"2025-10-25T{18 + i // 4:02d}:{(i % 4) * 15:02d}:00.000000-0800"
        rows.append(
            {
                "timestamp": ts,
                "absorbance_od600": f"{od:.6f}",
                "cell_concentration_cells_per_ml": str(int(od * 1e9)),
                "parent_well": parent_well,
                "consider_data": str(consider_data),
            }
        )
    return rows


# ---------------------------------------------------------------------------
# fit_exponential_growth
# ---------------------------------------------------------------------------


class TestFitExponentialGrowth:
    """Tests for the exponential curve fitting function."""

    @pytest.mark.parametrize("true_rate", [0.03, 0.08, 0.12, 0.15])
    def test_recovers_known_growth_rate(self, true_rate: float):
        t = np.linspace(0, 10, 50)
        od = 0.1 * np.exp(true_rate * t)

        rate, dt, r2 = fit_exponential_growth(t, od)

        assert rate == pytest.approx(true_rate, rel=1e-6)
        assert r2 == pytest.approx(1.0, abs=1e-10)
        assert dt == pytest.approx(math.log(2) / true_rate, rel=1e-6)

    def test_flat_growth_returns_zero_rate(self):
        t = np.linspace(0, 10, 20)
        od = np.full_like(t, 0.5)

        rate, dt, _r2 = fit_exponential_growth(t, od)

        assert rate == pytest.approx(0.0, abs=1e-10)
        assert dt is None

    def test_declining_od_returns_negative_rate(self):
        t = np.linspace(0, 10, 20)
        od = 0.5 * np.exp(-0.05 * t)

        rate, dt, _r2 = fit_exponential_growth(t, od)

        assert rate < 0
        assert dt is None

    def test_fewer_than_two_points(self):
        rate, dt, r2 = fit_exponential_growth(np.array([0.0]), np.array([0.1]))

        assert rate == 0.0
        assert dt is None
        assert r2 == 0.0

    def test_empty_arrays(self):
        rate, dt, r2 = fit_exponential_growth(np.array([]), np.array([]))

        assert rate == 0.0
        assert dt is None
        assert r2 == 0.0

    def test_zero_od_values_filtered(self):
        """OD values <= 0 can't be log-transformed and should be skipped."""
        t = np.array([0, 1, 2, 3, 4])
        od = np.array([0.0, 0.1, 0.0, 0.2, 0.3])

        rate, _dt, r2 = fit_exponential_growth(t, od)

        assert rate != 0.0
        assert r2 > 0


# ---------------------------------------------------------------------------
# load_od_data
# ---------------------------------------------------------------------------


class TestLoadOdData:
    """Tests for CSV loading, filtering, and sorting."""

    def test_filters_consider_data(self, tmp_path: Path):
        rows = [
            {
                "timestamp": "2025-10-25T18:00:00.000000-0800",
                "absorbance_od600": "0.1",
                "cell_concentration_cells_per_ml": "100000000",
                "parent_well": "stock",
                "consider_data": "False",
            },
            {
                "timestamp": "2025-10-25T18:15:00.000000-0800",
                "absorbance_od600": "0.2",
                "cell_concentration_cells_per_ml": "200000000",
                "parent_well": "stock",
                "consider_data": "True",
            },
            {
                "timestamp": "2025-10-25T18:30:00.000000-0800",
                "absorbance_od600": "0.3",
                "cell_concentration_cells_per_ml": "300000000",
                "parent_well": "stock",
                "consider_data": "True",
            },
        ]
        csv_path = tmp_path / "well_A1_absorbance.csv"
        _write_well_csv(csv_path, rows)

        elapsed, od, parent = load_od_data(csv_path)

        assert len(elapsed) == 2
        assert od[0] == pytest.approx(0.2)
        assert od[1] == pytest.approx(0.3)
        assert parent == "stock"

    def test_sorts_by_timestamp(self, tmp_path: Path):
        """Data not in chronological order should be sorted."""
        rows = [
            {
                "timestamp": "2025-10-25T19:00:00.000000-0800",
                "absorbance_od600": "0.3",
                "cell_concentration_cells_per_ml": "300000000",
                "parent_well": "A1",
                "consider_data": "True",
            },
            {
                "timestamp": "2025-10-25T18:00:00.000000-0800",
                "absorbance_od600": "0.1",
                "cell_concentration_cells_per_ml": "100000000",
                "parent_well": "A1",
                "consider_data": "True",
            },
            {
                "timestamp": "2025-10-25T18:30:00.000000-0800",
                "absorbance_od600": "0.2",
                "cell_concentration_cells_per_ml": "200000000",
                "parent_well": "A1",
                "consider_data": "True",
            },
        ]
        csv_path = tmp_path / "well_B1_absorbance.csv"
        _write_well_csv(csv_path, rows)

        elapsed, od, parent = load_od_data(csv_path)

        assert od[0] == pytest.approx(0.1)
        assert od[1] == pytest.approx(0.2)
        assert od[2] == pytest.approx(0.3)
        assert elapsed[0] == pytest.approx(0.0)
        assert elapsed[1] == pytest.approx(0.5)
        assert elapsed[2] == pytest.approx(1.0)
        assert parent == "A1"

    def test_all_filtered_out_returns_empty(self, tmp_path: Path):
        rows = [
            {
                "timestamp": "2025-10-25T18:00:00.000000-0800",
                "absorbance_od600": "0.1",
                "cell_concentration_cells_per_ml": "100000000",
                "parent_well": "stock",
                "consider_data": "False",
            },
        ]
        csv_path = tmp_path / "well_C1_absorbance.csv"
        _write_well_csv(csv_path, rows)

        elapsed, od, _parent = load_od_data(csv_path)

        assert len(elapsed) == 0
        assert len(od) == 0

    def test_handles_timezone_with_colon(self, tmp_path: Path):
        """Real data uses both -0800 and -08:00 formats."""
        rows = [
            {
                "timestamp": "2025-10-25T18:00:00.000000-08:00",
                "absorbance_od600": "0.1",
                "cell_concentration_cells_per_ml": "100000000",
                "parent_well": "stock",
                "consider_data": "True",
            },
            {
                "timestamp": "2025-10-25T18:15:00.000000-08:00",
                "absorbance_od600": "0.2",
                "cell_concentration_cells_per_ml": "200000000",
                "parent_well": "stock",
                "consider_data": "True",
            },
        ]
        csv_path = tmp_path / "well_D1_absorbance.csv"
        _write_well_csv(csv_path, rows)

        elapsed, _od, _parent = load_od_data(csv_path)

        assert len(elapsed) == 2
        assert elapsed[1] == pytest.approx(0.25)


# ---------------------------------------------------------------------------
# run (integration)
# ---------------------------------------------------------------------------


def _setup_iteration_dir(
    tmp_path: Path,
    well_configs: dict[str, dict],
    design_params: dict[str, dict],
) -> Path:
    """Create a complete iteration directory structure for testing."""
    iter_dir = tmp_path / "iter_test"
    (iter_dir / "input").mkdir(parents=True)
    (iter_dir / "output").mkdir(parents=True)

    designs = [{"well": w, "params": p} for w, p in design_params.items()]
    _write_design_mapping(iter_dir / "input" / "well_to_design_mapping.json", designs)

    for well_name, cfg in well_configs.items():
        rows = _make_exponential_rows(**cfg)
        _write_well_csv(iter_dir / "output" / f"well_{well_name}_absorbance.csv", rows)

    return iter_dir


class TestRunIntegration:
    """Integration tests for the full parser pipeline."""

    def test_produces_correct_output(self, tmp_path: Path):
        iter_dir = _setup_iteration_dir(
            tmp_path,
            well_configs={
                "A1": {"growth_rate": 0.10, "parent_well": "stock"},
                "A2": {"growth_rate": 0.06, "parent_well": "A1"},
            },
            design_params={
                "A1": {"cell_volume_uL": 40, "mix_height_mm": 1},
                "A2": {"cell_volume_uL": 60, "mix_height_mm": 2},
            },
        )

        metrics = run(iter_dir)

        assert metrics.iteration_id == "iter_test"
        assert len(metrics.results) == 2

        by_well = {r.well: r for r in metrics.results}
        a1 = by_well["A1"]
        assert a1.growth_rate == pytest.approx(0.10, rel=0.01)
        assert a1.parent_well == "stock"
        assert a1.params == {"cell_volume_uL": 40, "mix_height_mm": 1}
        assert a1.r_squared > 0.99
        assert a1.doubling_time_hours is not None
        assert a1.n_datapoints == 20
        assert a1.time_range_hours > 0

        output_file = iter_dir / "analysis" / "growth_metrics.json"
        assert output_file.exists()

        written = json.loads(output_file.read_text())
        assert written["iteration_id"] == "iter_test"
        assert len(written["results"]) == 2
        required_keys = {
            "well",
            "parent_well",
            "params",
            "growth_rate",
            "doubling_time_hours",
            "r_squared",
            "n_datapoints",
            "time_range_hours",
        }
        for result in written["results"]:
            assert required_keys <= set(result.keys())

    def test_well_csv_without_design_mapping(self, tmp_path: Path):
        """A well CSV with no matching design entry produces a result with empty params."""
        iter_dir = _setup_iteration_dir(
            tmp_path,
            well_configs={
                "A1": {"growth_rate": 0.08, "parent_well": "stock"},
                "X9": {"growth_rate": 0.05, "parent_well": "stock"},
            },
            design_params={
                "A1": {"cell_volume_uL": 40},
            },
        )

        metrics = run(iter_dir)
        by_well = {r.well: r for r in metrics.results}

        assert "X9" in by_well
        assert by_well["X9"].params == {}
        assert by_well["X9"].growth_rate > 0

    def test_design_mapping_without_csv(self, tmp_path: Path):
        """A well in the mapping but with no CSV should be silently skipped."""
        iter_dir = _setup_iteration_dir(
            tmp_path,
            well_configs={
                "A1": {"growth_rate": 0.08, "parent_well": "stock"},
            },
            design_params={
                "A1": {"cell_volume_uL": 40},
                "Z12": {"cell_volume_uL": 99},
            },
        )

        metrics = run(iter_dir)

        wells = [r.well for r in metrics.results]
        assert "A1" in wells
        assert "Z12" not in wells

    def test_well_with_no_valid_data_skipped(self, tmp_path: Path):
        """A well where all rows have consider_data=False should be skipped."""
        iter_dir = _setup_iteration_dir(
            tmp_path,
            well_configs={
                "A1": {"growth_rate": 0.08, "parent_well": "stock"},
            },
            design_params={
                "A1": {"cell_volume_uL": 40},
                "A2": {"cell_volume_uL": 60},
            },
        )
        bad_rows = _make_exponential_rows(growth_rate=0.05, consider_data=False)
        _write_well_csv(iter_dir / "output" / "well_A2_absorbance.csv", bad_rows)

        metrics = run(iter_dir)
        wells = [r.well for r in metrics.results]

        assert "A1" in wells
        assert "A2" not in wells

    def test_no_csvs_raises_error(self, tmp_path: Path):
        iter_dir = tmp_path / "iter_empty"
        (iter_dir / "input").mkdir(parents=True)
        (iter_dir / "output").mkdir(parents=True)
        _write_design_mapping(
            iter_dir / "input" / "well_to_design_mapping.json",
            [{"well": "A1", "params": {}}],
        )

        with pytest.raises(FileNotFoundError):
            run(iter_dir)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


class TestCLI:
    """Tests for the command-line interface."""

    def test_valid_run(self, tmp_path: Path, monkeypatch, capsys):
        iter_dir = _setup_iteration_dir(
            tmp_path,
            well_configs={"A1": {"growth_rate": 0.10, "parent_well": "stock"}},
            design_params={"A1": {"cell_volume_uL": 40}},
        )

        monkeypatch.setattr("sys.argv", ["cli", str(iter_dir)])

        from src.parser.cli import main

        main()

        captured = capsys.readouterr()
        assert "Parsed 1 wells" in captured.out
        assert "A1" in captured.out

    def test_invalid_path_exits_nonzero(self, monkeypatch):
        monkeypatch.setattr("sys.argv", ["cli", "/nonexistent/path"])

        from src.parser.cli import main

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

    def test_verbose_flag(self, tmp_path: Path, monkeypatch, capsys):
        iter_dir = _setup_iteration_dir(
            tmp_path,
            well_configs={"A1": {"growth_rate": 0.10, "parent_well": "stock"}},
            design_params={"A1": {"cell_volume_uL": 40}},
        )

        monkeypatch.setattr("sys.argv", ["cli", str(iter_dir), "-v"])

        from src.parser.cli import main

        main()

        captured = capsys.readouterr()
        assert "Parsed 1 wells" in captured.out


# ---------------------------------------------------------------------------
# Smoke test with full 96-well mock data
# ---------------------------------------------------------------------------


class TestSmokeFullPlate:
    """Smoke test with a full 96-well plate generated into tmp_path."""

    ROWS = "ABCDEFGH"
    COLS = range(1, 13)

    def _generate_96_well_data(self, tmp_path: Path) -> Path:
        """Generate a full 96-well iteration directory in tmp_path."""
        iter_dir = tmp_path / "iter_smoke"
        (iter_dir / "input").mkdir(parents=True)
        (iter_dir / "output").mkdir(parents=True)

        import random as rand_mod

        rng = rand_mod.Random(99)
        designs = []
        for row in self.ROWS:
            for col in self.COLS:
                well = f"{row}{col}"
                parent = "stock" if col == 1 else f"{row}1"
                rate = rng.uniform(0.02, 0.15)
                rows = _make_exponential_rows(
                    growth_rate=rate,
                    parent_well=parent,
                )
                _write_well_csv(iter_dir / "output" / f"well_{well}_absorbance.csv", rows)
                designs.append(
                    {
                        "well": well,
                        "params": {
                            "cell_volume_uL": round(rng.uniform(20, 80), 1),
                            "mix_height_mm": round(rng.uniform(1, 4), 1),
                            "mix_reps": round(rng.uniform(1, 5), 1),
                        },
                    }
                )

        _write_design_mapping(iter_dir / "input" / "well_to_design_mapping.json", designs)
        return iter_dir

    def test_parses_all_96_wells(self, tmp_path: Path):
        iter_dir = self._generate_96_well_data(tmp_path)

        metrics = run(iter_dir)

        assert len(metrics.results) == 96

        for r in metrics.results:
            assert r.growth_rate != 0.0
            assert r.n_datapoints > 0
            assert r.time_range_hours > 0
            assert 0 <= r.r_squared <= 1.0
            assert r.parent_well in ("stock",) or len(r.parent_well) <= 3
            assert r.params != {}
