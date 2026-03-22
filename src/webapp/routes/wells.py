"""Well-level endpoints."""

from __future__ import annotations

from fastapi import APIRouter

from src.webapp.config import DATA_DIR
from src.webapp.schemas import OdReading
from src.webapp.services import od_data_service

router = APIRouter(prefix="/api/iterations", tags=["wells"])


@router.get(
    "/{iteration_id}/wells/{well}/timeseries",
    response_model=list[OdReading],
)
def get_well_timeseries(iteration_id: str, well: str) -> list[OdReading]:
    return od_data_service.get_well_timeseries(DATA_DIR, iteration_id, well)
