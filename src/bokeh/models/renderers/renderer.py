#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2024, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Base classes for the various kinds of renderer types.

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
from ...core.enums import RenderLevel
from ...core.has_props import abstract
from ...core.properties import (
    Bool,
    Either,
    Enum,
    Instance,
    List,
    Nullable,
    Override,
    String,
)
from ...model import Model
from ..coordinates import CoordinateMapping

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "CompositeRenderer",
    "DataRenderer",
    "GuideRenderer",
    "Renderer",
    "RendererGroup",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class RendererGroup(Model):
    """A collection of renderers.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    visible = Bool(default=True, help="""
    Makes all grouped renderers visible or not.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class Renderer(Model):
    """An abstract base class for renderer types.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    level = Enum(RenderLevel, help="""
    Specifies the level in which to paint this renderer.
    """)

    visible = Bool(default=True, help="""
    Is the renderer visible.
    """)

    coordinates = Nullable(Instance(CoordinateMapping))

    x_range_name = String("default", help="""
    A particular (named) x-range to use for computing screen locations when
    rendering glyphs on the plot. If unset, use the default x-range.
    """)

    y_range_name = String("default", help="""
    A particular (named) y-range to use for computing screen locations when
    rendering glyphs on the plot. If unset, use the default y-range.
    """)

    group = Nullable(Instance(RendererGroup))

    propagate_hover = Bool(default=False, help="""
    Allows to propagate hover events to the parent renderer, frame or canvas.

    .. note::
        This property is experimental and may change at any point.
    """)

    context_menu = Nullable(Instance(".models.ui.Menu"), default=None, help="""
    A menu to display when user right clicks on the component.

    .. note::
        Use shift key when right clicking to display the native context menu.
    """)

@abstract
class CompositeRenderer(Renderer):
    """ A renderer that allows attaching UI elements to it.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    elements = List(
        Either(
            Instance(".models.ui.ui_element.UIElement"),
            Instance(".models.dom.DOMNode"),
            Instance(".models.dom.HTML"),
        ),
    )(default=[], help="""
    A collection of UI elements attached to this renderer.

    This can include floating elements like tooltips, allowing to establish
    parent <-> child relationship between elements.
    """)

@abstract
class DataRenderer(Renderer):
    """ An abstract base class for data renderer types (e.g. ``GlyphRenderer``, ``GraphRenderer``).

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    level = Override(default="glyph")

@abstract
class GuideRenderer(Renderer):
    """ A base class for all guide renderer types. ``GuideRenderer`` is
    not generally useful to instantiate on its own.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    level = Override(default="guide")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
