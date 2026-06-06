"""Utility package shim.

This package exists at the project root and should expose the utilities
implemented under `backend/utils`. To avoid shadowing issues between the
root-level `utils` package and `backend/utils`, append the backend utils
directory to this package's `__path__` so submodule imports like
`utils.validation` will resolve to `backend/utils/validation.py`.
"""
from pathlib import Path
import sys

_base = Path(__file__).resolve().parent
_project_root = _base.parent
_backend_utils = str(_project_root / "backend" / "utils")
if _backend_utils not in __path__:
	__path__.append(_backend_utils)
