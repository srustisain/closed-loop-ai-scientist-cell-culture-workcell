"""Generate synthetic per-well absorbance CSVs for testing the data parser.

Creates realistic-looking OD600 time series with exponential growth for all
96 wells of a standard plate, matching the format from the Monomer platereader.

Each well gets randomized but plausible growth parameters so the mock data
exercises a range of growth rates, noise levels, and edge cases.

Usage:
    python scripts/generate_mock_data.py
"""

import csv
import json
import math
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

ITERATION_DIR = Path("data/iterations/iter_001")
OUTPUT_DIR = ITERATION_DIR / "output"
INPUT_DIR = ITERATION_DIR / "input"

PST = timezone(timedelta(hours=-8))
BASE_TIME = datetime(2025, 10, 25, 18, 0, 0, tzinfo=PST)

ROWS = "ABCDEFGH"
COLS = range(1, 13)

READING_INTERVAL_MIN = 15
NUM_READINGS = 40
LAG_READINGS = 5

PARAM_RANGES = {
    "cell_volume_uL": (20, 80),
    "mix_height_mm": (1, 4),
    "mix_reps": (1, 5),
}


def _all_well_names():
    """Yield all 96 well names: A1, A2, ..., H12."""
    for row in ROWS:
        for col in COLS:
            yield f"{row}{col}"


def generate_well_configs(seed: int = 42):
    """Generate randomized growth parameters for all 96 wells.

    Column 1 wells (A1, B1, ...) are seeded from stock.
    All other wells are passaged from the column-1 well in the same row.
    Growth rates span a realistic range (0.02 - 0.15 /h).
    """
    rng = random.Random(seed)
    configs = {}
    for well in _all_well_names():
        row_letter = well[0]
        col_num = int(well[1:])
        parent = "stock" if col_num == 1 else f"{row_letter}1"

        configs[well] = {
            "parent_well": parent,
            "od_start": rng.uniform(0.08, 0.20),
            "growth_rate": rng.uniform(0.02, 0.15),
            "noise_std": rng.uniform(0.002, 0.008),
        }
    return configs


def generate_design_mapping(seed: int = 42):
    """Generate a well-to-design mapping with randomized parameters for 96 wells."""
    rng = random.Random(seed + 1000)
    designs = []
    for well in _all_well_names():
        params = {}
        for name, (lo, hi) in PARAM_RANGES.items():
            params[name] = round(rng.uniform(lo, hi), 1)
        designs.append({"well": well, "params": params})
    return {"designs": designs}


def generate_well_csv(well_name: str, config: dict, rng: random.Random) -> None:
    output_path = OUTPUT_DIR / f"well_{well_name}_absorbance.csv"

    rows = []
    for i in range(NUM_READINGS):
        ts = BASE_TIME + timedelta(minutes=i * READING_INTERVAL_MIN)
        elapsed_h = (i * READING_INTERVAL_MIN) / 60.0

        od = config["od_start"] * math.exp(config["growth_rate"] * elapsed_h)
        od += rng.gauss(0, config["noise_std"])
        od = max(od, 0.01)

        in_exponential = i >= LAG_READINGS
        cell_conc = int(od * 1e9)

        rows.append({
            "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S.%f%z"),
            "absorbance_od600": f"{od:.4f}",
            "cell_concentration_cells_per_ml": str(cell_conc),
            "parent_well": config["parent_well"],
            "consider_data": str(in_exponential),
        })

    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "timestamp", "absorbance_od600", "cell_concentration_cells_per_ml",
            "parent_well", "consider_data",
        ])
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    INPUT_DIR.mkdir(parents=True, exist_ok=True)

    configs = generate_well_configs()
    design_mapping = generate_design_mapping()

    mapping_path = INPUT_DIR / "well_to_design_mapping.json"
    mapping_path.write_text(json.dumps(design_mapping, indent=2))
    print(f"Wrote design mapping for {len(design_mapping['designs'])} wells to {mapping_path}")

    rng = random.Random(42)
    print(f"Generating mock platereader data for {len(configs)} wells...")
    for well_name, config in configs.items():
        generate_well_csv(well_name, config, rng)
    print(f"Done. Created {len(configs)} CSV files in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
