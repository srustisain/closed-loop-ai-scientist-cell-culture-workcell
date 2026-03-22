# Data parser

Reads per-well OD600 CSVs from the platereader and the well-to-design mapping from the experiment designer, fits growth curves, and writes **`growth_metrics.json`** (design parameters linked to growth metrics per well).

The [webapp](../webapp/README.md) is a read-only HTTP layer over those files.

**Full setup (install `uv` + `npm` deps, run parser, run API + UI):** [root README](../../README.md).

---

## Quick start (parser only)

From the **repository root** (after `uv sync`):

```bash
# Optional: generate mock 96-well data
uv run python scripts/generate_mock_data.py

# Run the parser on one iteration directory
uv run python -m src.parser data/iterations/iter_001

# Verbose logging
uv run python -m src.parser data/iterations/iter_001 -v
```

(`python -m src.parser` uses `src/parser/__main__.py`, which delegates to the CLI.)

---

## What it does

```
 well_A1_absorbance.csv      ─┐
 well_A2_absorbance.csv      ─┤
 ...                         ├──→  Data parser  ──→  growth_metrics.json
 well_H12_absorbance.csv     ─┤                      (plus experiment designer / BO
 well_to_design_mapping.json ─┘                       consuming the same outputs)
```

Platereader CSVs only contain OD readings; they do not include experimental parameters. The parser joins CSVs with **`well_to_design_mapping.json`** so downstream tools (e.g. Bayesian optimization) can relate conditions to growth.

---

## Expected directory layout

```
data/iterations/iter_001/
├── input/
│   └── well_to_design_mapping.json   # from experiment designer
├── output/
│   ├── well_A1_absorbance.csv        # from platereader (typically 96 files)
│   ├── well_A2_absorbance.csv
│   └── ...
└── analysis/
    └── growth_metrics.json           # written by this parser
```

---

## Input formats

### Per-well absorbance CSV

One file per well: `well_{WELL}_absorbance.csv`.

| Column | Example | Description |
|--------|---------|-------------|
| `timestamp` | `2025-10-25T21:32:45.242355-08:00` | ISO 8601 with timezone |
| `absorbance_od600` | `0.4274` | Raw OD600 |
| `cell_concentration_cells_per_ml` | `427400000` | Derived concentration |
| `parent_well` | `stock`, `A1` | Passage source |
| `consider_data` | `True` / `False` | Use row in fitting only if `True` |

Only rows with `consider_data=True` are used for curve fitting.

Example platereader-style dumps: [Scale-Me-Maybe sample data](https://github.com/hrahman12/Scale-Me-Maybe/tree/main/data) (external reference).

### Well-to-design mapping JSON

```json
{
  "designs": [
    {"well": "A1", "params": {"cell_volume_uL": 40, "mix_height_mm": 1, "mix_reps": 3}},
    {"well": "A2", "params": {"cell_volume_uL": 60, "mix_height_mm": 2, "mix_reps": 5}}
  ]
}
```

---

## Output format

**`growth_metrics.json`** (schema: `IterationMetrics` / `WellResult` in `models.py`):

```json
{
  "iteration_id": "iter_001",
  "results": [
    {
      "well": "A2",
      "parent_well": "A1",
      "params": {"cell_volume_uL": 60, "mix_height_mm": 2, "mix_reps": 5},
      "growth_rate": 0.1192,
      "doubling_time_hours": 5.8,
      "r_squared": 0.994,
      "max_od": 0.8734,
      "n_datapoints": 35,
      "time_range_hours": 8.5
    }
  ]
}
```

---

## Metrics

| Field | Meaning | Notes |
|-------|---------|--------|
| `growth_rate` (1/h) | Slope of ln(OD) vs time (exponential phase) | Primary optimization target: higher = faster growth |
| `doubling_time_hours` | ln(2) / growth_rate | Intuitive doubling time; `null` if rate ≤ 0 |
| `r_squared` | Fit quality on log-OD | Data-quality hint; high ≈ reliable fit |
| `max_od` | Max OD600 in valid window | Secondary target for biomass-oriented BO |
| `n_datapoints` | Valid points used | Supports confidence in the estimate |
| `time_range_hours` | Span of valid data | Context for the fit window |

---

## Code layout

| Path | Role |
|------|------|
| `models.py` | Pydantic input/output schemas |
| `parser.py` | Load CSVs + mapping, fit, write JSON |
| `cli.py` | CLI entrypoint |
| `__main__.py` | `python -m src.parser` |

Tests: `tests/test_parser.py` (see root README for `pytest` commands).

---

## Tests (overview)

| Area | Coverage |
|------|----------|
| Curve fitting | Known rates (parameterized), flat / declining OD, edge cases (too few points, empty, zeros) |
| CSV loading | `consider_data`, timestamp sort, timezone variants, all rows filtered |
| Integration | End-to-end temp dirs: schema, missing mapping/CSV, bad wells skipped, no CSVs → error |
| CLI | Success path, bad path exit code, `-v` |
| Smoke | Full 96-well generated data parsed |

Tests use `tmp_path` only; they do not rely on checked-in `data/iterations/` for correctness.
