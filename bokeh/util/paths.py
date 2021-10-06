#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
import sys
from os.path import (
    abspath,
    dirname,
    isdir,
    join,
    normpath,
    realpath,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# Root dir of Bokeh package
ROOT_DIR = dirname(dirname(abspath(__file__)))

__all__ = (
    'serverdir',
    'bokehjsdir',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def serverdir() -> str:
    """ Get the location of the server subpackage
    """
    path = join(ROOT_DIR, 'server')
    path = normpath(path)
    if sys.platform == 'cygwin': path = realpath(path)
    return path


def bokehjsdir(dev: bool = False) -> str:
    """ Get the location of the bokehjs source files. If dev is True,
    the files in bokehjs/build are preferred. Otherwise uses the files
    in bokeh/server/static.
    """
    dir1 = join(ROOT_DIR, '..', 'bokehjs', 'build')
    dir2 = join(serverdir(), 'static')
    if dev and isdir(dir1):
        return dir1
    else:
        return dir2

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
