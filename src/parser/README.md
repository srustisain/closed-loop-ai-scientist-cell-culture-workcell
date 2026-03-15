# Data Parser

Reads per-well OD600 absorbance CSVs from the platereader and the well-to-design mapping from the experiment designer, computes growth metrics for each well, and outputs a single JSON linking design parameters to growth outcomes.

## Quick start

```bash
# from the project root

# 1. install dependencies (one-time)
uv sync

# 2. generate mock 96-well data (for testing)
uv run python scripts/generate_mock_data.py

# 3. run the parser
uv run python -m src.parser.cli data/iterations/iter_001

# verbose mode
uv run python -m src.parser.cli data/iterations/iter_001 -v
```

## What it does

```
 well_A1_absorbance.csv  ─┐
 well_A2_absorbance.csv  ─┤                      ┌──→ Experiment Designer (BO)
 ...                      ├──→  Data Parser  ──→  │
 well_H12_absorbance.csv ─┤                      └──→ Webapp
 well_to_design_mapping.json ─┘
```

The platereader CSVs only contain OD readings -- they don't know what experimental parameters were used in each well. The parser joins them with the design mapping so the Bayesian optimizer can learn which parameter combinations produce faster growth.

## Expected directory layout

```
data/iterations/iter_001/
├── input/
│   └── well_to_design_mapping.json   # from Experiment Designer
├── output/
│   ├── well_A1_absorbance.csv        # from platereader (96 files)
│   ├── well_A2_absorbance.csv
│   └── ...
└── analysis/
    └── growth_metrics.json           # produced by this parser
```

## Input formats

### Per-well absorbance CSV

One file per well, named `well_{WELL}_absorbance.csv`:

| Column | Example | Description |
|--------|---------|-------------|
| `timestamp` | `2025-10-25T21:32:45.242355-08:00` | ISO 8601 with timezone |
| `absorbance_od600` | `0.4274` | Raw OD600 reading |
| `cell_concentration_cells_per_ml` | `427400000` | Derived cell concentration |
| `parent_well` | `stock`, `A1` | Which well this was passaged from |
| `consider_data` | `True` / `False` | Whether this reading is valid for analysis |

Only rows with `consider_data=True` are used for curve fitting.

This format matches the data retrieved from the Monomer platereader via MCP (see [Scale-Me-Maybe sample data](https://github.com/hrahman12/Scale-Me-Maybe/tree/main/data) for reference).

### Well-to-design mapping JSON

```json
{
  "designs": [
    {"well": "A1", "params": {"cell_volume_uL": 40, "mix_height_mm": 1, "mix_reps": 3}},
    {"well": "A2", "params": {"cell_volume_uL": 60, "mix_height_mm": 2, "mix_reps": 5}}
  ]
}
```

## Output format

`growth_metrics.json`:

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
      "n_datapoints": 35,
      "time_range_hours": 8.5
    }
  ]
}
```

## Metrics

| Metric | Definition | Purpose |
|--------|------------|---------|
| `growth_rate` (1/h) | Slope of ln(OD) vs time. From OD(t) = OD_0 * e^(mu*t), mu is the growth rate. | **Primary optimization target** -- higher = faster growth. |
| `doubling_time_hours` | ln(2) / growth_rate | Human-readable equivalent. Useful for sanity-checking against literature. |
| `r_squared` (0-1) | R-squared of the linear fit on log-transformed OD data. | **Data quality flag** -- above 0.95 is reliable, below 0.8 is suspect. |
| `n_datapoints` | Number of valid (`consider_data=True`) readings used. | Context for how much data backs the estimate. |
| `time_range_hours` | Time span of valid data. | Context for the observation window. |

## Tests

```bash
uv run pytest           # run all tests with coverage
uv run pytest -v        # verbose output
```

Coverage is enforced at 90% minimum (configured in `pyproject.toml`).

| Area | What's tested |
|------|---------------|
| **Curve fitting** | Recovers known growth rates (parameterized across 4 rates), flat growth, declining OD, zero/negative values, too few datapoints |
| **CSV loading** | Filters `consider_data`, sorts out-of-order timestamps, handles both timezone formats (`-0800` and `-08:00`), empty result when all rows filtered |
| **Integration** | End-to-end with temp directories: correct output schema, well CSV without design mapping (empty params), design mapping without CSV (skipped), well with no valid data (skipped), no CSVs (raises error) |
| **CLI** | Valid run prints summary, invalid path exits non-zero, verbose flag |
| **Smoke** | Full 96-well plate generated and parsed, all results checked for sanity |

Tests use `tmp_path` for isolation -- no test modifies the working directory or depends on pre-existing data.

## Linting and formatting

Uses [ruff](https://docs.astral.sh/ruff/) for both linting and formatting (configured in `pyproject.toml`).

```bash
uv run ruff check .          # lint
uv run ruff check --fix .    # lint and auto-fix
uv run ruff format .         # format (black-compatible)
uv run ruff format --check . # check formatting without changing files
```

## Code structure

```
src/parser/
├── models.py       # Pydantic schemas for inputs and outputs
├── parser.py       # Core logic: load, link, fit, write
├── cli.py          # CLI entrypoint
└── __main__.py     # Enables `python -m src.parser.cli`

tests/
└── test_parser.py  # All parser tests (22 tests)
```
