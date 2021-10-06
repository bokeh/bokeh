#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
from typing import List, Sequence

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

def ls_files(*patterns: str) -> List[str]:
    proc = run(["git", "ls-files", "--", *patterns], capture_output=True)
    return proc.stdout.decode("utf-8").split("\n")

def ls_modules(*, dir: str = "bokeh", skip_prefixes: Sequence[str] = [], skip_main: bool = True) -> List[str]:
    modules: List[str] = []

    files = ls_files(f"{dir}/**.py")

    for file in files:
        if not file:
            continue

        if file.endswith("__main__.py") and skip_main:
            continue

        module = file.replace("/", ".").replace(".py", "").replace(".__init__", "")

        if any(module.startswith(prefix) for prefix in skip_prefixes):
            continue

        modules.append(module)

    return modules

def verify_clean_imports(target: str, modules: List[str]) -> str:
    imports =  ";".join(f"import {m}" for m in modules)
    return f"import sys; {imports}; sys.exit(1 if any({target!r} in x for x in sys.modules.keys()) else 0)"

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
