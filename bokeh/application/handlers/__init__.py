#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''' Provides different ways for Bokeh applications to modify Bokeh
Documents when sessions are created.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from .code import CodeHandler
from .directory import DirectoryHandler
from .function import FunctionHandler
from .handler import Handler
from .notebook import NotebookHandler
from .script import ScriptHandler
from .server_lifecycle import ServerLifecycleHandler

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'CodeHandler',
    'DirectoryHandler',
    'FunctionHandler',
    'Handler',
    'NotebookHandler',
    'ScriptHandler',
    'ServerLifecycleHandler',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
