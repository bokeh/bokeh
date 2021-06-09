#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations # isort:skip

# Standard library imports
from pathlib import Path
from subprocess import run
from typing import List

TOP_PATH = Path(__file__).resolve().parent.parent.parent

def ls_files(*patterns: str) -> List[str]:
    proc = run(["git", "ls-files", "--", *patterns], capture_output=True)
    return proc.stdout.decode("utf-8").split("\n")

def verify_clean_imports(target: str, modules: List[str]) -> str:
    imports =  ";".join(f"import {m}" for m in modules)
    return f"import sys; {imports}; sys.exit(1 if any({target!r} in x for x in sys.modules.keys()) else 0)"
