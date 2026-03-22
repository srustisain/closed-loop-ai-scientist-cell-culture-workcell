"""Webapp configuration."""

from __future__ import annotations

import os
from pathlib import Path


def get_data_dir() -> Path:
    """Root directory containing ``iter_*`` iteration folders.

    Override with env ``WEBAPP_DATA_DIR`` (e.g. a temp directory in tests).
    Default: ``data/iterations`` relative to the process working directory.
    """
    return Path(os.environ.get("WEBAPP_DATA_DIR", "data/iterations"))
