"""
CLI entrypoint for the data parser.

Usage:
    python -m src.parser.cli <iteration_dir>

Example:
    python -m src.parser.cli data/iterations/iter_001

This reads the well-to-design mapping and per-well OD CSVs from the
iteration directory, computes growth metrics, and writes the results
to analysis/growth_metrics.json inside the same directory.
"""

import argparse
import logging
import sys
from pathlib import Path

from src.parser.parser import run


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Parse platereader OD data and compute growth metrics for one iteration."
    )
    parser.add_argument(
        "iteration_dir",
        type=Path,
        help="Path to the iteration directory (e.g. data/iterations/iter_001)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(levelname)s: %(message)s",
    )

    if not args.iteration_dir.is_dir():
        print(f"Error: {args.iteration_dir} is not a directory", file=sys.stderr)
        sys.exit(1)

    metrics = run(args.iteration_dir)

    print(f"Parsed {len(metrics.results)} wells for {metrics.iteration_id}")
    for r in metrics.results:
        dt_str = f"{r.doubling_time_hours:.1f}h" if r.doubling_time_hours else "N/A"
        print(
            f"  {r.well}: growth_rate={r.growth_rate:.4f}/h  "
            f"doubling={dt_str}  "
            f"R²={r.r_squared:.3f}  "
            f"({r.n_datapoints} points, {r.time_range_hours:.1f}h)"
        )


if __name__ == "__main__":
    main()
