"""Service for reading iteration data from the filesystem."""

from __future__ import annotations

import json
import statistics
from pathlib import Path

from fastapi import HTTPException

from src.parser.models import DesignMapping, IterationMetrics
from src.webapp.schemas import IterationSummary


def _iteration_dir(data_dir: Path, iteration_id: str) -> Path:
    path = data_dir / iteration_id
    if not path.is_dir():
        raise HTTPException(
            status_code=404,
            detail=f"Iteration '{iteration_id}' not found. Expected directory at {path}",
        )
    return path


def _load_metrics(iteration_dir: Path) -> IterationMetrics:
    metrics_path = iteration_dir / "analysis" / "growth_metrics.json"
    if not metrics_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"No growth_metrics.json in {iteration_dir}. "
            "Has the parser been run on this iteration?",
        )
    with open(metrics_path) as f:
        return IterationMetrics.model_validate(json.load(f))


def list_iterations(data_dir: Path) -> list[IterationSummary]:
    """Scan data_dir for iteration directories and return a summary of each."""
    if not data_dir.is_dir():
        raise HTTPException(
            status_code=404,
            detail=f"Data directory not found at {data_dir}. "
            "Run: uv run python scripts/generate_mock_data.py",
        )

    summaries: list[IterationSummary] = []
    for entry in sorted(data_dir.iterdir()):
        if not entry.is_dir() or not entry.name.startswith("iter_"):
            continue

        metrics_path = entry / "analysis" / "growth_metrics.json"
        if not metrics_path.exists():
            continue

        metrics = _load_metrics(entry)
        if not metrics.results:
            continue

        rates = [r.growth_rate for r in metrics.results]
        best_idx = max(range(len(rates)), key=lambda i: rates[i])

        summaries.append(
            IterationSummary(
                iteration_id=metrics.iteration_id,
                well_count=len(metrics.results),
                mean_growth_rate=round(statistics.mean(rates), 6),
                best_growth_rate=round(rates[best_idx], 6),
                best_well=metrics.results[best_idx].well,
            )
        )

    return summaries


def get_iteration(data_dir: Path, iteration_id: str) -> IterationMetrics:
    """Load full metrics for a single iteration."""
    return _load_metrics(_iteration_dir(data_dir, iteration_id))


def get_design_mapping(data_dir: Path, iteration_id: str) -> DesignMapping:
    """Load the well-to-design mapping for an iteration."""
    iter_dir = _iteration_dir(data_dir, iteration_id)
    mapping_path = iter_dir / "input" / "well_to_design_mapping.json"
    if not mapping_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"No well_to_design_mapping.json in {iter_dir / 'input'}",
        )
    with open(mapping_path) as f:
        return DesignMapping.model_validate(json.load(f))
