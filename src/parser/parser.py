"""
Core data parser logic.

Reads per-well OD600 CSVs and the well-to-design mapping, computes growth
metrics for each well, and writes the combined results to a JSON file.

Expected directory layout for an iteration:

    data/iterations/iter_001/
        input/
            well_to_design_mapping.json
        output/
            well_A1_absorbance.csv
            well_A2_absorbance.csv
            ...
        analysis/
            growth_metrics.json   <-- produced by this parser
"""

from __future__ import annotations

import csv
import json
import logging
import math
from datetime import datetime
from glob import glob
from pathlib import Path

import numpy as np
from scipy import stats

from src.parser.models import DesignMapping, IterationMetrics, WellResult

logger = logging.getLogger(__name__)


def load_od_data(csv_path: Path) -> tuple[np.ndarray, np.ndarray, str]:
    """Read a single well's absorbance CSV and return valid data points.

    Filters to rows where consider_data=True, sorts by timestamp, and
    converts timestamps to elapsed hours from the earliest reading.

    Returns
    -------
    elapsed_hours : np.ndarray
        Time in hours relative to the first valid reading.
    od_values : np.ndarray
        OD600 absorbance values.
    parent_well : str
        The parent well identifier (e.g. 'stock', 'A1').
    """
    rows = []
    parent_well = "unknown"

    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            parent_well = row["parent_well"]
            if row["consider_data"].strip().lower() != "true":
                continue
            ts = _parse_timestamp(row["timestamp"])
            od = float(row["absorbance_od600"])
            rows.append((ts, od))

    if not rows:
        return np.array([]), np.array([]), parent_well

    rows.sort(key=lambda r: r[0])
    t0 = rows[0][0]
    elapsed_hours = np.array([(r[0] - t0).total_seconds() / 3600.0 for r in rows])
    od_values = np.array([r[1] for r in rows])

    return elapsed_hours, od_values, parent_well


def _parse_timestamp(ts_str: str) -> datetime:
    """Parse ISO 8601 timestamp, handling timezone offset with or without colon."""
    ts_str = ts_str.strip()
    for fmt in ("%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%dT%H:%M:%S%z"):
        try:
            return datetime.strptime(ts_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"Unable to parse timestamp: {ts_str}")


def fit_exponential_growth(
    elapsed_hours: np.ndarray, od_values: np.ndarray
) -> tuple[float, float | None, float]:
    """Fit an exponential growth model to OD time series data.

    Performs linear regression on ln(OD) vs time. The slope of that line
    is the specific growth rate (mu).

    Parameters
    ----------
    elapsed_hours : np.ndarray
        Time values in hours.
    od_values : np.ndarray
        OD600 readings (must be > 0 for log transform).

    Returns
    -------
    growth_rate : float
        Specific growth rate mu (1/hour). Slope of ln(OD) vs time.
    doubling_time : float | None
        ln(2) / growth_rate, or None if growth_rate <= 0.
    r_squared : float
        Coefficient of determination for the linear fit on log-transformed data.
    """
    positive_mask = od_values > 0
    t = elapsed_hours[positive_mask]
    od = od_values[positive_mask]

    if len(t) < 2:
        return 0.0, None, 0.0

    ln_od = np.log(od)
    slope, _intercept, r_value, _p_value, _std_err = stats.linregress(t, ln_od)

    growth_rate = float(slope)
    r_squared = float(r_value**2)
    doubling_time = float(math.log(2) / growth_rate) if growth_rate > 0 else None

    return growth_rate, doubling_time, r_squared


def _extract_well_name(csv_path: Path) -> str:
    """Extract well name from filename like 'well_A3_absorbance.csv' -> 'A3'."""
    name = csv_path.stem
    parts = name.split("_")
    if len(parts) >= 2 and parts[0] == "well":
        return parts[1]
    return name


def run(iteration_dir: str | Path) -> IterationMetrics:
    """Run the full parser pipeline for one iteration.

    1. Loads the well-to-design mapping from input/
    2. Reads all well_*_absorbance.csv files from output/
    3. Computes growth metrics per well
    4. Links metrics to design parameters
    5. Writes growth_metrics.json to analysis/

    Parameters
    ----------
    iteration_dir : str or Path
        Path to an iteration directory, e.g. data/iterations/iter_001

    Returns
    -------
    IterationMetrics
        The computed metrics (also written to disk).
    """
    iteration_dir = Path(iteration_dir)
    iteration_id = iteration_dir.name

    mapping_path = iteration_dir / "input" / "well_to_design_mapping.json"
    with open(mapping_path) as f:
        design_mapping = DesignMapping.model_validate(json.load(f))

    params_by_well = {d.well: d.params for d in design_mapping.designs}

    csv_pattern = str(iteration_dir / "output" / "well_*_absorbance.csv")
    csv_files = sorted(glob(csv_pattern))

    if not csv_files:
        raise FileNotFoundError(
            f"No well_*_absorbance.csv files found in {iteration_dir / 'output'}"
        )

    results: list[WellResult] = []

    for csv_file in csv_files:
        csv_path = Path(csv_file)
        well_name = _extract_well_name(csv_path)

        elapsed_hours, od_values, parent_well = load_od_data(csv_path)

        if len(elapsed_hours) < 2:
            logger.warning("Well %s: fewer than 2 valid datapoints, skipping", well_name)
            continue

        growth_rate, doubling_time, r_squared = fit_exponential_growth(elapsed_hours, od_values)

        max_od = float(np.max(od_values))
        time_range = float(elapsed_hours[-1] - elapsed_hours[0])
        params = params_by_well.get(well_name, {})

        if well_name not in params_by_well:
            logger.warning("Well %s: no design mapping found, params will be empty", well_name)

        results.append(
            WellResult(
                well=well_name,
                parent_well=parent_well,
                params=params,
                growth_rate=growth_rate,
                doubling_time_hours=doubling_time,
                r_squared=r_squared,
                max_od=max_od,
                n_datapoints=len(elapsed_hours),
                time_range_hours=time_range,
            )
        )

    metrics = IterationMetrics(iteration_id=iteration_id, results=results)

    analysis_dir = iteration_dir / "analysis"
    analysis_dir.mkdir(parents=True, exist_ok=True)
    output_path = analysis_dir / "growth_metrics.json"
    output_path.write_text(metrics.model_dump_json(indent=2))

    logger.info("Wrote growth metrics for %d wells to %s", len(results), output_path)

    return metrics
