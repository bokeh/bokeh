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

# pyright: reportAttributeAccessIssue=false, reportUnsupportedDunderAll=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Any

# Bokeh imports
from . import (
    buttons,
    groups,
    indicators,
    inputs,
    markdown,
    markups,
    pickers,
    sliders,
    tables,
    widget,
)
from .buttons import *
from .groups import *
from .indicators import *
from .inputs import *
from .markdown import *
from .markups import *
from .pickers import *
from .sliders import *
from .tables import *
from .widget import *

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# Keep dynamic submodule __all__ aggregation visible to type checkers.
def _all(module: Any) -> tuple[str, ...]:
    return module.__all__

__all__ = (
    *_all(buttons),
    *_all(groups),
    *_all(indicators),
    *_all(inputs),
    *_all(markdown),
    *_all(markups),
    *_all(pickers),
    *_all(sliders),
    *_all(tables),
    *_all(widget),
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
