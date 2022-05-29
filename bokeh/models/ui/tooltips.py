#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""

"""

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
from ...core.enums import Anchor, TooltipAttachment
from ...core.properties import (
    Auto,
    Bool,
    Either,
    Enum,
    Float,
    NonNullable as Required,
    Nullable,
    Override,
    String,
    Tuple,
)
from .ui_element import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Tooltip",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Tooltip(UIElement):
    """ Render a tooltip.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    visible = Override(default=False)

    position = Nullable(Either(Enum(Anchor), Tuple(Float, Float)), default=None, help="""
    The position of the tooltip with respect to its parent. It can be either
    an absolute position within the parent or an anchor point for symbolic
    positioning.
    """)

    content = Required(String, help="""
    Rich HTML contents of this tooltip.
    """)

    attachment = Either(Enum(TooltipAttachment), Auto, default="auto", help="""
    Whether the tooltip should be displayed to the left or right of the cursor
    position or above or below it, or if it should be automatically placed
    in the horizontal or vertical dimension.
    """)

    show_arrow = Bool(default=True, help="""
    Whether tooltip's arrow should be shown.
    """)

    closable = Bool(default=False, help="""
    Allows to hide dismiss tooltip by clicking close (x) button. Useful when
    using this model for persistent tooltips.
    """)

    interactive = Bool(default=True, help="""
    Whether to allow pointer events on the contents of this tooltip. Depending
    on the use case, it may be necessary to disable interactions for better
    user experience. This however will prevent the user from interacting with
    the contents of this tooltip, e.g. clicking links.
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
