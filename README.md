# Development

## Setup

```bash
uv sync                       # install all dependencies
uv run pre-commit install     # enable pre-commit hooks
```

## Tests

```bash
uv run pytest           # run all tests with coverage
uv run pytest -v        # verbose output
```

Coverage is enforced at 90% minimum (configured in `pyproject.toml`).

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

## Pre-commit hooks

Ruff, mypy, and tests run automatically on every `git commit`. Set up once with:

```bash
uv run pre-commit install
```

To run all hooks manually against all files:

```bash
uv run pre-commit run --all-files
```

## CI

GitHub Actions runs lint, type checking, and tests on every push to `main` and on pull requests. See `.github/workflows/ci.yml`.
