#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Renderers for various kinds of HTML annotations that can be added to plots.

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportAttributeAccessIssue=false, reportUnsupportedDunderAll=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from . import html_annotation, labels, toolbars
from .html_annotation import *
from .labels import *
from .toolbars import *

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# Keep dynamic submodule __all__ aggregation visible to type checkers.
def _all(module: Any) -> tuple[str, ...]:
    return module.__all__

__all__ = (
    *_all(html_annotation),
    *_all(labels),
    *_all(toolbars),
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
