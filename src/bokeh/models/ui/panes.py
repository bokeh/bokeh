#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various kinds of panes. """

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
from ...core.properties import Either, Instance, List
from ..dom import DOMNode
from .ui_element import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Pane",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Pane(UIElement):
    """ A UI element that can hold other DOM-based UI elements.

    ``Pane`` is a basic building block of DOM-based UIs, and as such it
    doesn't include any properties for controlling its position and other
    visual aspects. These must be configured up by using CSS stylesheets.
    If finer control is needed, use ``Panel`` or ``LayoutDOM`` derived
    models instead.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    elements = List(Either(Instance(UIElement), Instance(DOMNode)), default=[], help="""
    A collection of DOM-based UI elements attached to this pane.

    This can include floating elements like tooltips, allowing to establish
    a parent-child relationship between this and other UI elements.
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
