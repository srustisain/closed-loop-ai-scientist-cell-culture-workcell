"""Iteration endpoints."""

from __future__ import annotations

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends

from src.parser.models import DesignMapping, IterationMetrics
from src.webapp.config import get_data_dir
from src.webapp.schemas import IterationSummary
from src.webapp.services import iteration_service

router = APIRouter(prefix="/api/iterations", tags=["iterations"])


@router.get("", response_model=list[IterationSummary])
def list_iterations(data_dir: Annotated[Path, Depends(get_data_dir)]) -> list[IterationSummary]:
    return iteration_service.list_iterations(data_dir)


@router.get("/{iteration_id}", response_model=IterationMetrics)
def get_iteration(
    iteration_id: str, data_dir: Annotated[Path, Depends(get_data_dir)]
) -> IterationMetrics:
    return iteration_service.get_iteration(data_dir, iteration_id)


@router.get("/{iteration_id}/design-mapping", response_model=DesignMapping)
def get_design_mapping(
    iteration_id: str, data_dir: Annotated[Path, Depends(get_data_dir)]
) -> DesignMapping:
    return iteration_service.get_design_mapping(data_dir, iteration_id)
