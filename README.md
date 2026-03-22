# Development

## Setup

```bash
uv sync                       # install all dependencies
uv run pre-commit install     # enable pre-commit hooks
```

## Tests

```bash
uv run pytest                      # all tests + coverage report (no fail-under; good for subsets)
uv run pytest --cov-fail-under=88  # full suite with enforced minimum coverage (same as CI)
uv run pytest -v                   # verbose output
```

To run only webapp API tests:

```bash
uv run pytest tests/test_webapp_api.py -q --no-cov
```

`--no-cov` avoids a **misleading ~64% total**: default `addopts` still measure `src/parser` + `src/webapp`, but webapp-only tests never run the parser, so combined coverage looks low even though tests passed. For a real coverage gate, run the **full** suite: `uv run pytest --cov-fail-under=88`.

**If your shell is in `frontend/`**, pytest’s config lives one level up, but pytest only applies `testpaths` when you invoke it from the **repository root**. From `frontend/` you must either change directory or tell `uv` to run from the root:

```bash
cd .. && uv run pytest tests/test_webapp_api.py -q --no-cov
# or, from frontend/:
uv run --directory .. pytest tests/test_webapp_api.py -q --no-cov
npm run test:api
```

Coverage is enforced at **88%** minimum for `src/parser` and `src/webapp` (see `pyproject.toml`).

## Linting and formatting

Uses [ruff](https://docs.astral.sh/ruff/) for both linting and formatting (configured in `pyproject.toml`).

```bash
uv run ruff check .          # lint
uv run ruff check --fix .    # lint and auto-fix
uv run ruff format .         # format (black-compatible)
uv run ruff format --check . # check formatting without changing files
```

## Type checking

Uses [mypy](https://mypy-lang.org/) with the Pydantic plugin. Checks `src/` only (not tests or scripts).

```bash
uv run mypy src/
```

## Webapp (API + React)

**API tests** (FastAPI read layer, no browser):

```bash
uv run pytest tests/test_webapp_api.py -q --no-cov
```

**Frontend** (requires Node 18+; install deps once with `npm ci` in `frontend/`):

```bash
cd frontend && npm ci && npm run lint && npm run build
```

From `frontend/`, run Python API tests via `npm run test:api` or `npm run test:python` (see `frontend/package.json`).

CI runs the same checks; `frontend/package-lock.json` is tracked for reproducible installs.

## Pre-commit hooks

Ruff, mypy, tests, and **frontend ESLint** (when `frontend/` files are committed) run on `git commit`. Set up once with:

```bash
uv run pre-commit install
```

To run all hooks manually against all files:

```bash
uv run pre-commit run --all-files
```

## CI

GitHub Actions runs Python lint, type checking, tests, and a **frontend** job (`npm ci`, `npm run lint`, `npm run build`) on every push to `main` and on pull requests. See `.github/workflows/ci.yml`.
