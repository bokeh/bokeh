#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various kinds of icons to be used with Button widgets.
See :ref:`ug_interaction_widgets_examples_button` in the |user guide|
for more information.
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
from ...core.enums import ToolIcon
from ...core.has_props import abstract
from ...core.properties import (
    Color,
    Either,
    Enum,
    FontSize,
    Int,
    Required,
    String,
)
from ...core.property.bases import Init
from ...core.property.singletons import Intrinsic
from .ui_element import UIElement

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Icon",
    "BuiltinIcon",
    "SVGIcon",
    "TablerIcon",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class Icon(UIElement):
    """ An abstract base class for icon elements.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

    size = Either(Int, FontSize, default="1em", help="""
    The size of the icon. This can be either a number of pixels, or a CSS
    length string (see https://developer.mozilla.org/en-US/docs/Web/CSS/length).
    """)

class BuiltinIcon(Icon):
    """ Built-in icons included with BokehJS. """

    # explicit __init__ to support Init signatures
    def __init__(self, icon_name: Init[str] = Intrinsic, **kwargs: Any) -> None:
        super().__init__(icon_name=icon_name, **kwargs)

    icon_name = Required(Either(Enum(ToolIcon), String), help="""
    The name of a built-in icon to use. Currently, the following icon names are
    supported: ``"help"``, ``"question-mark"``, ``"settings"``, ``"x"``

    .. bokeh-plot::
        :source-position: none

        from bokeh.io import show
        from bokeh.layouts import column
        from bokeh.models import BuiltinIcon, Button

        builtin_icons = ["help", "question-mark", "settings", "x"]

        icon_demo = []
        for icon in builtin_icons:
            icon_demo.append(Button(label=icon, button_type="light", icon=BuiltinIcon(icon, size="1.2em")))

        show(column(icon_demo))

    """)

    color = Color(default="gray", help="""
    Color to use for the icon.
    """)

class SVGIcon(Icon):
    """ SVG icons with inline definitions. """

    # explicit __init__ to support Init signatures
    def __init__(self, svg: Init[str] = Intrinsic, **kwargs: Any) -> None:
        super().__init__(svg=svg, **kwargs)

    svg = Required(String, help="""
    The SVG definition of an icon.
    """)

class TablerIcon(Icon):
    """
    Icons from an external icon provider (https://tabler-icons.io/).

    .. note::
        This icon set is MIT licensed (see https://github.com/tabler/tabler-icons/blob/master/LICENSE).

    .. note::
        External icons are loaded from third-party servers and may not be available
        immediately (e.g. due to slow internet connection) or not available at all.
        It isn't possible to create a self-contained bundles with the use of
        ``inline`` resources. To circumvent this, one use ``SVGIcon``, by copying
        the SVG contents of an icon from Tabler's web site.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, icon_name: Init[str] = Intrinsic, **kwargs: Any) -> None:
        super().__init__(icon_name=icon_name, **kwargs)

    icon_name = Required(String, help="""
    The name of the icon. See https://tabler-icons.io/ for the list of names.
    """)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
