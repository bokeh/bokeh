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

# Standard library imports
from typing import Any

# Bokeh imports
from ...core.has_props import abstract
from ...core.properties import (
    Bool,
    Dict,
    Either,
    Enum,
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
    "StyledElement",
    "UIElement",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class StyledElement(Model):
    """ A base class for DOM-based UI elements with configurable styling.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    html_attributes = Dict(String, String, default={}, help="""
    Allows to configure HTML attributes on the underlying HTML element.
    """)

    html_id = Nullable(String, default=None, help="""
    Sets the ``id`` attribute of the underlying HTML element.

    This is a shorthand for the common HTML ``id`` attribute. Alternatively
    the ``id`` can be set in the ``html_attributes`` dictionary. ``html_id``
    takes precedence.
    """)

    css_classes = List(String, default=[], help="""
    A list of additional CSS classes to add to the underlying DOM element.
    """).accepts(Seq(String), lambda x: list(x))

    css_variables = Dict(String, Either(String, Instance(Node)), default={}, help="""
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

@abstract
class UIElement(StyledElement):
    """ Base class for user interface elements.
    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    visible = Bool(default=True, help="""
    Whether the component should be displayed on screen.
    """)

    context_menu = Nullable(Either(Instance(".models.ui.Menu"), Enum("auto")), default=None, help="""
    A menu to display when user right clicks on the component.

    If set to ``"auto"``, the component may provide a dynamically generated
    menu. For example, ``Plot`` and related models provide a ``ToolMenu``
    instance for easy access to their tools.

    .. note::
        Use shift key when right clicking to display the native context menu.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
