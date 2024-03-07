#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from .deprecation import deprecated

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# Root dir of Bokeh package
ROOT_DIR = Path(__file__).absolute().resolve().parent.parent

__all__ = (
    "bokehjs_path",
    "bokehjsdir",
    "server_path",
    "serverdir",
    "static_path",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def server_path() -> Path:
    """ Get the location of the server subpackage.

    """
    return ROOT_DIR / "server"

def static_path() -> Path:
    """ Get the location of server's static directory.

    """
    return server_path() / "static"

def bokehjs_path(dev: bool = False) -> Path:
    """ Get the location of the bokehjs source files.

    By default the files in ``bokeh/server/static`` are used.  If ``dev``
    is ``True``, then the files in ``bokehjs/build`` preferred. However,
    if not available, then a warning is issued and the former files are
    used as a fallback.

    .. note:
        This is a low-level API. Prefer using ``settings.bokehjs_path()``
        instead of this function.
    """
    if dev:
        js_dir = ROOT_DIR.parent.parent / "bokehjs" / "build"
        if js_dir.is_dir():
            return js_dir
        else:
            log.warning(f"bokehjs' build directory '{js_dir}' doesn't exist; required by 'settings.dev'")

    return static_path()

#-----------------------------------------------------------------------------
# Legacy API
#-----------------------------------------------------------------------------

def serverdir() -> str:
    """ Get the location of the server subpackage.

    .. deprecated:: 3.4.0
        Use ``server_path()`` instead.
    """
    deprecated((3, 4, 0), "serverdir()", "server_path()")
    return str(server_path())

def bokehjsdir(dev: bool = False) -> str:
    """ Get the location of the bokehjs source files.

    By default the files in ``bokeh/server/static`` are used.  If ``dev``
    is ``True``, then the files in ``bokehjs/build`` preferred. However,
    if not available, then a warning is issued and the former files are
    used as a fallback.

    .. note:
        This is a low-level API. Prefer using ``settings.bokehjsdir()``
        instead of this function.

    .. deprecated:: 3.4.0
        Use ``bokehjs_path()`` instead.
    """
    deprecated((3, 4, 0), "bokehjsdir()", "bokehjs_path()")
    return str(bokehjs_path(dev))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
