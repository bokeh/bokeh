#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

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

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# Root dir of Bokeh package
ROOT_DIR = Path(__file__).absolute().resolve().parent.parent

__all__ = (
    "serverdir",
    "bokehjsdir",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def serverdir() -> Path:
    """
    Get the location of the server subpackage.
    """
    return ROOT_DIR / "server"

def staticdir() -> Path:
    """
    Get the location of server's static directory.
    """
    return serverdir() / "static"

def bokehjsdir(dev: bool = False) -> Path:
    """
    Get the location of the bokehjs source files.

    If ``dev`` is ``True``, the files in ``bokehjs/build`` are preferred.
    Otherwise uses the files in ``bokeh/server/static``.
    """
    if dev:
        js_dir = ROOT_DIR.parent.parent / "bokehjs" / "build"
        assert js_dir.is_dir(), f"{js_dir} doesn't exist"
        return js_dir
    else:
        return staticdir()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
