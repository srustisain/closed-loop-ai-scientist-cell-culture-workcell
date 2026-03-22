# Webapp

HTTP API (FastAPI) and React UI for browsing **iteration metrics** produced by the [data parser](../parser/README.md): plate heatmaps, OD time series, design parameters, and dashboard charts.

Shared contract: Pydantic models in [`src/parser/models.py`](../parser/models.py) (`WellResult`, `IterationMetrics`, design mapping) are imported by the API as response types—no duplicate schemas.

Repository-wide tests, lint, and CI: [root README](../../README.md).

---

## Quick start (API + UI)

From the **repository root** (after `uv sync` and `cd frontend && npm ci && cd ..` — see [root README](../../README.md)):

```bash
# Terminal 1
uv run uvicorn src.webapp.main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```

- UI: http://localhost:5173  
- OpenAPI: http://localhost:8000/docs  

The API reads **`data/iterations/`** by default; run the [parser](../parser/README.md) (or `scripts/generate_mock_data.py`) first if that folder is empty.

---

## Architecture

```
Browser (React)  --HTTP/JSON-->  FastAPI  --reads-->  data/iterations/iter_NNN/
                                        analysis/growth_metrics.json
                                        input/well_to_design_mapping.json
                                        output/well_*_absorbance.csv
```

- **Parser** writes `analysis/growth_metrics.json` (and upstream CSVs / mapping come from instruments + designer).  
- **API** reads the filesystem only; there is no application database.  
- **`WEBAPP_DATA_DIR`** (optional) points at the folder that contains `iter_*` directories (default: `data/iterations` relative to the process working directory). Tests override the data path via FastAPI dependency injection.

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| API | FastAPI + Uvicorn | Same Pydantic models as the parser; OpenAPI at `/docs`. |
| Frontend | React 19 + TypeScript + Vite | Heatmaps and interactive charts. |
| UI | Tailwind CSS v4 (`@tailwindcss/vite`) + shadcn-style components | Consistent layout and forms. |
| Charts | Plotly.js via `react-plotly.js` | Scatter, violins, time series. |
| Routing | React Router | Dashboard, iteration, history, compare. |
| Data | TanStack Query | Caching and loading states for API calls. |

---

## HTTP API

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/health` | `{ "status": "ok" }` |
| GET | `/api/iterations` | List of iteration summaries (id, well counts, mean/best growth rate) |
| GET | `/api/iterations/{id}` | Full `IterationMetrics` (same shape as `growth_metrics.json`) |
| GET | `/api/iterations/{id}/wells/{well}/timeseries` | `[{ elapsed_hours, od600 }, …]` from the well CSV |
| GET | `/api/iterations/{id}/design-mapping` | Well-to-design JSON from `input/` |

There is **no** dedicated “compare” endpoint: the Compare page loads several `GET /api/iterations/{id}` responses in parallel.

---

## Frontend (high level)

| Area | Role |
|------|------|
| `pages/` | `Dashboard`, `IterationView`, `History`, `Compare` |
| `components/plate/` | `PlateHeatmap`, `WellDetailPanel` |
| `components/charts/` | OD curve, metric pairs, violins, overview sections |
| `components/layout/` | `AppShell`, `Sidebar`, `SiteMainHeader`, `PageHeader` |
| `components/wells/` | Well ID + experimental design tooltips |
| `components/dashboard/` | Iteration filter for the dashboard |
| `components/feedback/` | Empty states, API errors, error boundary |
| `api/client.ts` | `fetch` + TanStack Query hooks |
| `types/index.ts` | TypeScript types aligned with API payloads (maintain alongside Pydantic if models change) |
| `config/site.ts` | App title, GitHub URL |

**Tailwind** is wired through Vite (`vite.config.ts`); there is no separate `tailwind.config.ts` in this repo.

---

## Running locally

**Install everything + run the parser + full copy-paste flow:** [repository README](../../README.md) (sections *Quick start*, *Install everything*, *Run the data parser*, *Run the dashboard*).

**Environment:** `WEBAPP_DATA_DIR` (optional) — directory that **contains** the `iter_*` folders. Default is `data/iterations` relative to the process working directory when you start Uvicorn.

---

## Typescript types and OpenAPI

Types live in `frontend/src/types/index.ts` and are kept in line with the API by hand. If you add `openapi-typescript` later, you can regenerate from a running API, e.g.:

```bash
npx openapi-typescript http://localhost:8000/openapi.json -o src/types/api.ts
```

(There is no `npm run generate-types` script unless you add one.)

---

## Python package layout

```
src/webapp/
├── main.py                 # FastAPI app, CORS, routers
├── config.py               # get_data_dir()
├── schemas.py              # API-specific shapes if needed
├── routes/
│   ├── iterations.py
│   └── wells.py
└── services/
    ├── iteration_service.py
    └── od_data_service.py
```

---

## Feature snapshot

| Area | Status |
|------|--------|
| Iteration list / detail, design mapping, well time series | Implemented |
| Plate heatmap, well detail + OD chart, design in UI | Implemented |
| Dashboard charts (overview + detailed violins), history, compare | Implemented |
| Live WebSocket / workcell status | Not implemented in this codebase (no WS routes in `main.py`) |

---

## Quality checks

**Python (repo root):** see [root README](../../README.md) (`pytest`, `ruff`, `mypy`, CI).

**Frontend** (`frontend/` after `npm ci`):

| Check | Command |
|-------|---------|
| ESLint | `npm run lint` |
| Typecheck + build | `npm run build` |
| API tests only (from `frontend/`) | `npm run test:api` |
| Full Python suite + coverage gate | `npm run test:python` |

Pre-commit and GitHub Actions mirror the root README + frontend job; see `.github/workflows/ci.yml`.
