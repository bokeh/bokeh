#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various UI elements such as buttons, menus, and tooltips.
"""
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
    dialogs,
    examiner,
    floating,
    icons,
    menus,
    panels,
    panes,
    tooltips,
    ui_element,
)
from .dialogs import *
from .examiner import *
from .floating import *
from .icons import *
from .menus import *
from .panels import *
from .panes import *
from .tooltips import *
from .ui_element import *

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# Keep dynamic submodule __all__ aggregation visible to type checkers.
def _all(module: Any) -> tuple[str, ...]:
    return module.__all__

__all__ = (
    *_all(dialogs),
    *_all(icons),
    *_all(examiner),
    *_all(floating),
    *_all(menus),
    *_all(panels),
    *_all(panes),
    *_all(tooltips),
    *_all(ui_element),
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
