#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
