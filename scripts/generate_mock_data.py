"""Generate synthetic per-well absorbance CSVs for testing the data parser.

Creates realistic-looking OD600 time series with exponential growth for all
96 wells of a standard plate, matching the format from the Monomer platereader.

Each well gets randomized but plausible growth parameters so the mock data
exercises a range of growth rates, noise levels, and edge cases.

Usage:
    uv run python scripts/generate_mock_data.py
    uv run python scripts/generate_mock_data.py iter_002
    uv run python scripts/generate_mock_data.py data/iterations/iter_003
    uv run python scripts/generate_mock_data.py iter_002 --seed 999

Then run the parser on that folder:
    uv run python -m src.parser data/iterations/iter_002
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import random
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

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

PST = timezone(timedelta(hours=-8))
BASE_TIME_START = datetime(2025, 10, 25, 18, 0, 0, tzinfo=PST)


def _all_well_names():
    """Yield all 96 well names: A1, A2, ..., H12."""
    for row in ROWS:
        for col in COLS:
            yield f"{row}{col}"


def resolve_iteration_dir(arg: str | None) -> Path:
    """Resolve CLI arg to an iteration directory under data/iterations/."""
    if arg is None:
        return Path("data/iterations/iter_001")
    p = Path(arg)
    if len(p.parts) == 1 and re.match(r"^iter_\d+$", p.name):
        return Path("data/iterations") / p.name
    return p


def default_seed_for_iteration(iteration_dir: Path) -> int:
    """Stable, distinct RNG seed per iter_NNN (iter_001 -> 42, iter_002 -> 179, ...)."""
    m = re.match(r"iter_(\d+)$", iteration_dir.name)
    if not m:
        return 42
    n = int(m.group(1))
    return 42 + (n - 1) * 137


def base_time_for_iteration(iteration_dir: Path) -> datetime:
    """Shift base timestamp per iteration so runs are not identical on disk."""
    m = re.match(r"iter_(\d+)$", iteration_dir.name)
    day_offset = int(m.group(1)) - 1 if m else 0
    return BASE_TIME_START + timedelta(days=day_offset)


def generate_well_configs(seed: int):
    """Generate randomized growth parameters for all 96 wells."""
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


def generate_design_mapping(seed: int):
    """Generate a well-to-design mapping with randomized parameters for 96 wells."""
    rng = random.Random(seed + 1000)
    designs = []
    for well in _all_well_names():
        params = {}
        for name, (lo, hi) in PARAM_RANGES.items():
            params[name] = round(rng.uniform(lo, hi), 1)
        designs.append({"well": well, "params": params})
    return {"designs": designs}


def generate_well_csv(
    output_dir: Path,
    well_name: str,
    config: dict,
    rng: random.Random,
    base_time: datetime,
) -> None:
    output_path = output_dir / f"well_{well_name}_absorbance.csv"

    rows = []
    for i in range(NUM_READINGS):
        ts = base_time + timedelta(minutes=i * READING_INTERVAL_MIN)
        elapsed_h = (i * READING_INTERVAL_MIN) / 60.0

        od = config["od_start"] * math.exp(config["growth_rate"] * elapsed_h)
        od += rng.gauss(0, config["noise_std"])
        od = max(od, 0.01)

        in_exponential = i >= LAG_READINGS
        cell_conc = int(od * 1e9)

        rows.append(
            {
                "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S.%f%z"),
                "absorbance_od600": f"{od:.4f}",
                "cell_concentration_cells_per_ml": str(cell_conc),
                "parent_well": config["parent_well"],
                "consider_data": str(in_exponential),
            }
        )

    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "timestamp",
                "absorbance_od600",
                "cell_concentration_cells_per_ml",
                "parent_well",
                "consider_data",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)


def generate_iteration(iteration_dir: Path, seed: int) -> None:
    """Write input/ and output/ under iteration_dir (does not run the parser)."""
    output_dir = iteration_dir / "output"
    input_dir = iteration_dir / "input"
    output_dir.mkdir(parents=True, exist_ok=True)
    input_dir.mkdir(parents=True, exist_ok=True)

    configs = generate_well_configs(seed)
    design_mapping = generate_design_mapping(seed)

    mapping_path = input_dir / "well_to_design_mapping.json"
    mapping_path.write_text(json.dumps(design_mapping, indent=2))
    print(f"Wrote design mapping for {len(design_mapping['designs'])} wells to {mapping_path}")

    base_time = base_time_for_iteration(iteration_dir)
    noise_rng = random.Random(seed + 10_000)
    print(f"Generating mock platereader data for {len(configs)} wells (seed={seed})...")
    for well_name, config in configs.items():
        generate_well_csv(output_dir, well_name, config, noise_rng, base_time)
    print(f"Done. Created {len(configs)} CSV files in {output_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate mock iteration data under data/iterations/",
    )
    parser.add_argument(
        "iteration",
        nargs="?",
        default="iter_001",
        help="Iteration folder name (e.g. iter_002) or full path data/iterations/iter_002",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Override RNG seed (default: derived from iter_NNN so each iteration differs)",
    )
    args = parser.parse_args()

    iteration_dir = resolve_iteration_dir(args.iteration)
    seed = args.seed if args.seed is not None else default_seed_for_iteration(iteration_dir)

    if not re.match(r"^iter_\d+$", iteration_dir.name):
        print(
            f"Error: iteration folder should be named iter_NNN, got {iteration_dir.name}",
            file=sys.stderr,
        )
        sys.exit(1)

    generate_iteration(iteration_dir, seed)


if __name__ == "__main__":
    main()
