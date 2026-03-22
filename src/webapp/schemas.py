"""API-specific response models.

These are lightweight schemas used only by the webapp API. The core data models
(WellResult, IterationMetrics, DesignMapping) live in src.parser.models and are
reused directly as response types -- not duplicated here.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class IterationSummary(BaseModel):
    """Compact summary of one iteration, used in the iteration list endpoint."""

    iteration_id: str = Field(description="e.g. 'iter_001'")
    well_count: int = Field(description="Number of wells with valid growth data")
    mean_growth_rate: float = Field(description="Mean growth rate across all wells (1/h)")
    best_growth_rate: float = Field(description="Highest growth rate observed (1/h)")
    best_well: str = Field(description="Well with the highest growth rate")


class OdReading(BaseModel):
    """Single OD600 data point in a well's time series."""

    elapsed_hours: float
    od600: float
