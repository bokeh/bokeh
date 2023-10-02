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

    By default the files in ``bokeh/server/static`` are used.  If ``dev``
    is ``True``, then the files in ``bokehjs/build`` preferred. However,
    if not available, then a warning is issued and the former files are
    used as a fallback.
    """
    if dev:
        js_dir = ROOT_DIR.parent.parent / "bokehjs" / "build"
        if js_dir.is_dir():
            return js_dir
        else:
            log.warning(f"bokehjs' build directory '{js_dir}' doesn't exist; required by 'settings.dev'")

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
