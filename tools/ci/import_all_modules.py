#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
from importlib import import_module
from subprocess import run

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

if sys.flags.optimize != 2:
    raise RuntimeError("this check must run with Python optimization level 2 (-OO)")

proc = run(["git", "ls-files", "src/bokeh/**.py"], check=True, capture_output=True, text=True)

for file in proc.stdout.splitlines():
    module = file.removeprefix("src/").removesuffix(".py").replace("/", ".").removesuffix(".__init__")
    if not module.endswith(".__main__"):
        import_module(module)
