"""Well-level endpoints."""

from __future__ import annotations

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends

from src.webapp.config import get_data_dir
from src.webapp.schemas import OdReading
from src.webapp.services import od_data_service

router = APIRouter(prefix="/api/iterations", tags=["wells"])


@router.get(
    "/{iteration_id}/wells/{well}/timeseries",
    response_model=list[OdReading],
)
def get_well_timeseries(
    iteration_id: str,
    well: str,
    data_dir: Annotated[Path, Depends(get_data_dir)],
) -> list[OdReading]:
    return od_data_service.get_well_timeseries(data_dir, iteration_id, well)
