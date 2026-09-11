#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide functions for inspecting project structure and files.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from pathlib import Path
from subprocess import run
from typing import Sequence

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'TOP_PATH',
    'ls_files',
    'ls_modules',
    'verify_clean_imports',
)

TOP_PATH = Path(__file__).resolve().parent.parent.parent.parent

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def ls_files(*patterns: str) -> list[str]:
    proc = run(["git", "ls-files", "-z", "--", *patterns], capture_output=True)
    return proc.stdout.decode("utf-8").split("\0")

def ls_modules(*, skip_prefixes: Sequence[str] = [], skip_main: bool = True) -> list[str]:
    modules: list[str] = []

    files = ls_files("src/bokeh/**.py")

    for file in files:
        if not file:
            continue

        if file.endswith("__main__.py") and skip_main:
            continue

        module = file.strip("src/").replace("/", ".").replace(".py", "").replace(".__init__", "")

        if any(module.startswith(prefix) for prefix in skip_prefixes):
            continue

        modules.append(module)

    return modules

def verify_clean_imports(target: str | Sequence[str], modules: list[str]) -> str:
    targets = [target] if isinstance(target, str) else list(target)
    return f"""
import sys
for module in {modules!r}:
    __import__(module)
    for target in {targets!r}:
        if target in sys.modules:
            print(f"{{module}} imported {{target}}")
            sys.exit(1)
sys.exit(0)
"""

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
