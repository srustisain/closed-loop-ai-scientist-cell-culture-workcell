# Webapp

Human-facing dashboard for the closed-loop cell culture optimization system. Shows iteration results, OD growth curves, and workcell status.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| API | FastAPI + Uvicorn | Reuses parser's Pydantic models directly as response schemas. Auto-docs at `/docs`. WebSocket support for live status. |
| Frontend | React + TypeScript + Vite | Needed for the interactive 96-well heatmap and chart interactions. Vite gives fast dev reloads. |
| UI | Tailwind CSS + shadcn/ui | Consistent, polished components (tables, cards, tabs, dialogs) without writing custom CSS. |
| Charts | Plotly.js via react-plotly.js | Handles heatmaps, time-series, and scatter plots. Good fit for scientific data. |
| Routing | React Router | Page navigation (Dashboard, Iteration, History, Compare). |
| Data fetching | TanStack Query | Manages caching, loading states, and refetch logic so we don't hand-roll `useEffect` boilerplate. |

## Architecture

```
Browser (React)  --HTTP/JSON-->  FastAPI API  --reads-->  data/iterations/iter_NNN/
                 <--WebSocket--              <--queries-- Monomer MCP (workcell status)
```

The API is a thin read layer over the filesystem. The parser writes `growth_metrics.json` and per-well CSVs to disk; the API reads those files and serves them as JSON. No database. The `data/iterations/` directory structure is the data store.

The parser's Pydantic models (`WellResult`, `IterationMetrics` in `src/parser/models.py`) are imported and reused as FastAPI response schemas. No conversion code needed.

## API Endpoints

| Method | Endpoint | Returns |
|--------|----------|---------|
| GET | `/api/iterations` | List of iteration summaries (id, well count, mean/best growth rate) |
| GET | `/api/iterations/{id}` | Full `IterationMetrics` straight from `growth_metrics.json` |
| GET | `/api/iterations/{id}/wells/{well}/timeseries` | OD time-series: `[{elapsed_hours, od600}]` |
| GET | `/api/iterations/{id}/design-mapping` | Well-to-design mapping JSON |
| WS | `/api/ws/workcell-status` | Live workcell status from Monomer MCP |

No dedicated compare endpoint. The Compare page fetches multiple iterations via parallel `GET /api/iterations/{id}` calls and composes them on the frontend.

## Frontend Pages

**Dashboard.** Summary cards (total iterations, best growth rate, latest iteration link) and four stacked optimization charts (growth rate, max OD, R², doubling time): per-iteration violin distributions over all wells plus best-well markers.

**Iteration View.** The main page. A 96-well plate heatmap colored by a selectable metric (growth rate, max OD, R-squared, doubling time). Clicking a well opens a detail panel with the OD-vs-time chart (raw points plus fitted exponential), growth metrics, and design parameters for that well.

**History.** Sortable table of all past iterations.

**Compare.** Side-by-side heatmaps and parameter-space scatter plots across selected iterations. Lower priority.

## Directory Structure

```
src/webapp/                          # Python backend (FastAPI)
├── __init__.py
├── main.py                          # App creation, CORS, route mounting
├── config.py                        # `get_data_dir()` (default `data/iterations`, override `WEBAPP_DATA_DIR`)
├── routes/
│   ├── __init__.py
│   ├── iterations.py                # List, detail
│   └── wells.py                     # Well timeseries
└── services/
    ├── __init__.py
    ├── iteration_service.py         # Reads iteration files, returns Pydantic models
    └── od_data_service.py           # Parses well CSVs into timeseries arrays

frontend/                            # React app (lives at project root)
├── package.json
├── vite.config.ts                   # Proxies /api to localhost:8000
├── tailwind.config.ts
├── components.json                  # shadcn/ui config
└── src/
    ├── App.tsx                      # Router setup
    ├── api/client.ts                # Typed fetch wrapper + TanStack Query hooks
    ├── types/api.ts                 # Auto-generated from OpenAPI schema (do not edit)
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── IterationView.tsx
    │   ├── History.tsx
    │   └── Compare.tsx
    └── components/
        ├── plate/
        │   ├── PlateHeatmap.tsx      # Interactive 96-well plate
        │   └── WellDetailPanel.tsx   # Side panel: metrics + OD curve
        ├── charts/
        │   ├── OdCurveChart.tsx
        │   ├── OverviewMetricsSection.tsx      # Dashboard default: 2D metric vs metric scatter
        │   ├── MetricPairOverview.tsx
        │   ├── OptimizationMetricsSection.tsx  # Dashboard detailed: violins
        │   └── MetricViolinDistribution.tsx
        ├── layout/
        │   ├── AppShell.tsx          # Sidebar + header + content area
        │   └── Sidebar.tsx
        └── status/
            └── WorkcellStatus.tsx    # Persistent status indicator (header bar)
```

## Data Integration

The webapp consumes the parser's output. The shared types:

```python
# src/parser/models.py (imported by the API, not duplicated)
class WellResult(BaseModel):
    well: str                         # "A3"
    parent_well: str                  # "A1"
    params: dict[str, float]          # {"cell_volume_uL": 40, ...}
    growth_rate: float                # 1/h
    doubling_time_hours: float | None
    r_squared: float                  # fit quality, 0 to 1
    max_od: float                     # peak OD600
    n_datapoints: int
    time_range_hours: float

class IterationMetrics(BaseModel):
    iteration_id: str                 # "iter_001"
    results: list[WellResult]         # one per well (96 total)
```

Frontend TypeScript types are auto-generated from FastAPI's OpenAPI schema, not hand-maintained. With the API running:

```bash
cd frontend
npx openapi-typescript http://localhost:8000/openapi.json -o src/types/api.ts
```

This is also available as `npm run generate-types`. Re-run it whenever the Pydantic models change.

## Running Locally

Prerequisites: Python 3.10+, Node.js 18+, [uv](https://docs.astral.sh/uv/).

```bash
# Install Python dependencies (from project root)
uv sync

# Generate mock data if you don't have real experiment data
uv run python scripts/generate_mock_data.py

# Terminal 1: start the API (auto-reloads on changes)
uv run uvicorn src.webapp.main:app --reload --port 8000

# Terminal 2: start the frontend dev server
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173, proxies /api to localhost:8000
```

**Environment**

- `WEBAPP_DATA_DIR` (optional): filesystem root containing `iter_*` folders. Defaults to `data/iterations` relative to the process working directory. Tests override this via FastAPI dependency injection instead of env.

## Build Order

1. **Backend + Iteration View.** FastAPI routes and services, React scaffold, plate heatmap, well detail panel, OD curve chart.
2. **Dashboard + History.** Summary cards, per-metric violin charts, iteration table, sidebar navigation.
3. **Workcell Status + Compare.** WebSocket for Monomer MCP status, comparison page.
4. **Polish.** Loading states, error boundaries, shared empty/error UI, API tests (`tests/test_webapp_api.py`), coverage for `src/webapp`.

## Quality checks

From the **repository root**:

| Check | Command |
|-------|---------|
| Ruff (includes `src/webapp`) | `uv run ruff check .` |
| Ruff format | `uv run ruff format --check .` |
| Mypy (`src/` including webapp) | `uv run mypy src/` |
| API tests only (from repo root) | `uv run pytest tests/test_webapp_api.py -q --no-cov` |
| API tests from `frontend/` | `uv run --directory .. pytest tests/test_webapp_api.py -q --no-cov` or `npm run test:api` |
| Full test suite + coverage (enforced ≥88%) | `uv run pytest --cov-fail-under=88` |
| Full test suite, coverage report only | `uv run pytest` |

From **`frontend/`** (after `npm ci`):

| Check | Command |
|-------|---------|
| ESLint | `npm run lint` |
| Typecheck + production build | `npm run build` |
| API tests only | `npm run test:api` |
| Full Python suite (≥88% coverage) | `npm run test:python` |

Pre-commit runs Ruff, Ruff format, mypy, pytest, and frontend ESLint when relevant paths change. CI mirrors these steps; see `.github/workflows/ci.yml`.
