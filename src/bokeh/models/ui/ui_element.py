#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from ...core.has_props import abstract
from ...core.properties import (
    Bool,
    Dict,
    Either,
    Instance,
    List,
    Nullable,
    Seq,
    String,
)
from ...model import Model
from ..css import Styles, StyleSheet
from ..nodes import Node

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "UIElement",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class UIElement(Model):
    """ Base class for user interface elements.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    visible = Bool(default=True, help="""
    Whether the component should be displayed on screen.
    """)

    css_classes = List(String, default=[], help="""
    A list of additional CSS classes to add to the underlying DOM element.
    """).accepts(Seq(String), lambda x: list(x))

    css_variables = Dict(String, Instance(Node), default={}, help="""
    Allows to define dynamically computed CSS variables.

    This can be used, for example, to coordinate positioning and styling
    between canvas' renderers and/or visuals and HTML-based UI elements.

    Variables defined here are equivalent to setting the same variables
    under ``:host { ... }`` in a CSS stylesheet.

    .. note::
        This property is experimental and may change at any point.
    """)

    styles = Either(Dict(String, Nullable(String)), Instance(Styles), default={}, help="""
    Inline CSS styles applied to the underlying DOM element.
    """)

    stylesheets = List(
        Either(
            Instance(StyleSheet),
            String,
            Dict(String, Either(Dict(String, Nullable(String)), Instance(Styles)),
        ),
    ), help="""
    Additional style-sheets to use for the underlying DOM element.

    Note that all bokeh's components use shadow DOM, thus any included style
    sheets must reflect that, e.g. use ``:host`` CSS pseudo selector to access
    the root DOM element.
    """)

    context_menu = Nullable(Instance(".models.ui.Menu"), default=None, help="""
    A menu to display when user right clicks on the component.

    .. note::
        Use shift key when right clicking to display the native context menu.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
