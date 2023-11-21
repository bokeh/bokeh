#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Various kinds of indicator widgets.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ...core.enums import Align, Location, Orientation
from ...core.has_props import abstract
from ...core.properties import (
    Bool,
    Either,
    Enum,
    Instance,
    Int,
    Nullable,
    String,
)
from ..dom import HTML
from .widget import Widget

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Progress",
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class IndicatorWidget(Widget):
    """ Abstract base class for indicator widgets.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Progress(IndicatorWidget):
    """ Progress indicator widget.

    .. note::
        Due to the cooperative multi-tasking nature of JS runtime environments
        and bokehjs being a single-threaded library, long running tasks may
        prevent the progress from updating until computationally heavy tasks
        are completed.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    value = Nullable(Int, default=0, help="""
    The current progress between the minimum and maximum values.

    This can be set to ``None``, to indicate indeterminate progress. In such
    case the progress bar will show a infinite animation and no value label.
    """)

    min = Int(default=0, help="""
    The minimum value of the progress.
    """)

    max = Int(default=100, help="""
    The maximum value of the progress.
    """)

    reversed = Bool(default=False, help="""
    Allows to display the progress bar either left-to-right or right-to-left,
    or alternatively top-to-bottom or bottom-to-tol, depending on the chosen
    orientation.
    """)

    orientation = Enum(Orientation, default="horizontal", help="""
    Allows to orient the progress bar either horizontally or vertically.
    """)

    label = Either(String, Instance(HTML), default="@{progress}%", help="""
    """)

    label_location = Either(Enum("none", "inline"), Enum(Location), default="none", help="""
    """)

    label_align = Enum(Align, default="center", help="""
    Specifies where to align scale bar's label along the bar.

    This property effective when placing the label above or below
    a horizontal scale bar, or left or right of a vertical one.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
