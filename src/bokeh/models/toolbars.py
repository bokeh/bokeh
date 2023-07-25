#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" """

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
from typing import Literal, Sequence

# Bokeh imports
from ..core.properties import (
    Auto,
    Bool,
    Either,
    Enum,
    Instance,
    List,
    Null,
    Nullable,
    Seq,
)
from .tools import (
    Drag,
    GestureTool,
    InspectTool,
    Scroll,
    Tap,
    Tool,
    ToolProxy,
)
from .ui import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Toolbar",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Toolbar(UIElement):
    """" A collection of tools and UI controls for plots, etc.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    logo = Nullable(Enum("normal", "grey"), default="normal", help="""
    What version of the Bokeh logo to display on the toolbar. If
    set to None, no logo will be displayed.
    """)

    autohide = Bool(default=False, help="""
    Whether the toolbar will be hidden by default. Default: False.
    If True, hides toolbar when cursor is not in canvas.
    """)

    tools = List(Either(Instance(Tool), Instance(ToolProxy)), help="""
    A list of tools to add to the plot.
    """)

    active_drag: Literal["auto"] | Drag | None = Either(Null, Auto, Instance(Drag), default="auto", help="""
    Specify a drag tool to be active when the plot is displayed.
    """)

    active_inspect: Literal["auto"] | InspectTool | Sequence[InspectTool] | None = \
        Either(Null, Auto, Instance(InspectTool), Seq(Instance(InspectTool)), default="auto", help="""
    Specify an inspection tool or sequence of inspection tools to be active when
    the plot is displayed.
    """)

    active_scroll: Literal["auto"] | Scroll | None = Either(Null, Auto, Instance(Scroll), default="auto", help="""
    Specify a scroll/pinch tool to be active when the plot is displayed.
    """)

    active_tap: Literal["auto"] | Tap | None = Either(Null, Auto, Instance(Tap), default="auto", help="""
    Specify a tap/click tool to be active when the plot is displayed.
    """)

    active_multi: Literal["auto"] | GestureTool | None = Either(Null, Auto, Instance(GestureTool), default="auto", help="""
    Specify an active multi-gesture tool, for instance an edit tool or a range
    tool.

    Note that activating a multi-gesture tool will deactivate any other gesture
    tools as appropriate. For example, if a pan tool is set as the active drag,
    and this property is set to a ``BoxEditTool`` instance, the pan tool will
    be deactivated (i.e. the multi-gesture tool will take precedence).
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
