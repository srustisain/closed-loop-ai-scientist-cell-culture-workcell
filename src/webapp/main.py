"""FastAPI application for the cell culture optimization dashboard."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.webapp.routes import iterations, wells

app = FastAPI(
    title="Cell Culture Optimization API",
    description="API for the closed-loop AI scientist dashboard. "
    "Serves iteration metrics, well time-series, and design mappings "
    "produced by the data parser.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(iterations.router)
app.include_router(wells.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
