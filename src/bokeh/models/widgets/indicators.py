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

# Standard library imports
from typing import Any

# Bokeh imports
from ...core.enums import Orientation
from ...core.has_props import abstract
from ...core.properties import (
    Bool,
    Enum,
    Int,
    Nullable,
    String,
)
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
class Indicator(Widget):
    """ Abstract base class for indicator components.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Progress(Indicator):
    """ Linear progress indicator component.

    .. note::
        Long running or computationally heavy tasks may prevent the progress
        indicator from updating until such tasks are completed.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    mode = Enum("determinate", "indeterminate")(default="determinate", help="""
    Indicates the mode of operation of this widget.

    Supported modes are:
    * ``"determinate"`` where the component indicates progress of a task,
    computation, etc. until completion.
    * ``"indeterminate"`` where the component indicates stalled or infinitely
    running task. In this mode ``value``, ``min`` and ``max`` properties are
    ignored, and an infinite animation with no value label is displayed.

    .. note::
        The component can be switched between determinate and indeterminate
        modes during its operation.
    """)

    value = Int(default=0, help="""
    The current progress between the minimum and maximum values.
    """)

    min = Int(default=0, help="""
    The minimum value of the progress.
    """)

    max = Int(default=100, help="""
    The maximum value of the progress.
    """)

    reversed = Bool(default=False, help="""
    Allows to reverse progression of the progress.

    Depending on orientation this gives the following behaviors:

    * *left-to-right* when orientation is horizontal and not reversed
    * *right-to-left* when orientation is horizontal and reversed
    * *top-to-bottom* when orientation is vertical and not reversed
    * *bottom-to-top* when orientation is vertical and reversed
    """)

    orientation = Enum(Orientation, default="horizontal", help="""
    Allows to orient the progress bar either horizontally or vertically.
    """)

    label = Nullable(String)(default="@{percent}%", help="""
    Formatted value to show.

    May include the following special variables:

    * ``@{min}`` - the minimal value
    * ``@{max}`` - the maximal value
    * ``@{total}`` - the total number of steps
    * ``@{value}`` - the current value in the ``min`` to ``max`` range
    * ``@{index}`` - the current value in the 0 to ``total`` range
    * ``@{percent}`` - the current percentage of progress without ``%`` sign

    Special variables may additional specify a formatter, e.g. ``@{percent}{%.2f}``.
    """)

    label_location = Enum("none", "inline")(default="inline", help="""
    Determines where to place the label.
    """)

    description = Nullable(String)(help="""
    Optional long description to show in the from of a tooltip.

    This supports the same special variables as ``label`` property does.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
