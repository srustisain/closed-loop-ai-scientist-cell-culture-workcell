"""Generate synthetic per-well absorbance CSVs for testing the data parser.

Creates realistic-looking OD600 time series with exponential growth,
matching the format from the Monomer platereader.

Usage:
    python scripts/generate_mock_data.py
"""

import csv
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

OUTPUT_DIR = Path("data/iterations/iter_001/output")

PST = timezone(timedelta(hours=-8))
BASE_TIME = datetime(2025, 10, 25, 18, 0, 0, tzinfo=PST)

WELLS = {
    "A1": {
        "parent_well": "stock",
        "od_start": 0.15,
        "growth_rate": 0.08,
        "noise_std": 0.005,
    },
    "A2": {
        "parent_well": "A1",
        "od_start": 0.10,
        "growth_rate": 0.12,
        "noise_std": 0.004,
    },
    "B1": {
        "parent_well": "stock",
        "od_start": 0.12,
        "growth_rate": 0.05,
        "noise_std": 0.006,
    },
}

READING_INTERVAL_MIN = 15
NUM_READINGS = 40
LAG_READINGS = 5


def generate_well_csv(well_name: str, config: dict) -> None:
    output_path = OUTPUT_DIR / f"well_{well_name}_absorbance.csv"

    rows = []
    for i in range(NUM_READINGS):
        ts = BASE_TIME + timedelta(minutes=i * READING_INTERVAL_MIN)
        elapsed_h = (i * READING_INTERVAL_MIN) / 60.0

        od = config["od_start"] * math.exp(config["growth_rate"] * elapsed_h)
        import random
        random.seed(42 + hash(well_name) + i)
        od += random.gauss(0, config["noise_std"])
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

    print(f"  Created {output_path} ({len(rows)} rows)")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Generating mock platereader data...")
    for well_name, config in WELLS.items():
        generate_well_csv(well_name, config)
    print("Done.")


if __name__ == "__main__":
    main()
