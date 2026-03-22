"""Iteration endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from src.parser.models import DesignMapping, IterationMetrics
from src.webapp.config import DATA_DIR
from src.webapp.schemas import IterationSummary
from src.webapp.services import iteration_service

router = APIRouter(prefix="/api/iterations", tags=["iterations"])


@router.get("", response_model=list[IterationSummary])
def list_iterations() -> list[IterationSummary]:
    return iteration_service.list_iterations(DATA_DIR)


@router.get("/{iteration_id}", response_model=IterationMetrics)
def get_iteration(iteration_id: str) -> IterationMetrics:
    return iteration_service.get_iteration(DATA_DIR, iteration_id)


@router.get("/{iteration_id}/design-mapping", response_model=DesignMapping)
def get_design_mapping(iteration_id: str) -> DesignMapping:
    return iteration_service.get_design_mapping(DATA_DIR, iteration_id)
