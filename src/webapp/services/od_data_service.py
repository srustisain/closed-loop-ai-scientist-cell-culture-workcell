"""Service for reading per-well OD time-series data."""

from __future__ import annotations

import csv
from pathlib import Path

from fastapi import HTTPException

from src.parser.parser import _parse_timestamp
from src.webapp.schemas import OdReading


def get_well_timeseries(data_dir: Path, iteration_id: str, well: str) -> list[OdReading]:
    """Read a well's absorbance CSV and return the filtered OD time series.

    Only rows with consider_data=True are included. Timestamps are converted
    to elapsed hours from the first valid reading.
    """
    csv_path = data_dir / iteration_id / "output" / f"well_{well}_absorbance.csv"
    if not csv_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"No data file for well {well} in iteration {iteration_id}. "
            f"Expected: {csv_path.name}",
        )

    rows: list[tuple[float, float]] = []
    timestamps = []

    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["consider_data"].strip().lower() != "true":
                continue
            ts = _parse_timestamp(row["timestamp"])
            od = float(row["absorbance_od600"])
            timestamps.append(ts)
            rows.append((0.0, od))  # elapsed_hours filled below

    if not rows:
        return []

    t0 = min(timestamps)
    readings = []
    for i, (_, od) in enumerate(rows):
        elapsed = (timestamps[i] - t0).total_seconds() / 3600.0
        readings.append(OdReading(elapsed_hours=round(elapsed, 4), od600=od))

    readings.sort(key=lambda r: r.elapsed_hours)
    return readings
