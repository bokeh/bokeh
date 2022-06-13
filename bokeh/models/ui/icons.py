#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Various kinds of icon widgets.

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
    Color,
    Either,
    Float,
    NonNullable as Required,
    String,
)
from ...core.property.bases import Init
from ...core.property.singletons import Intrinsic
from ...model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Icon",
    "BuiltinIcon",
    "TablerIcon",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class Icon(Model):
    """ An abstract base class for icon widgets.

    """

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    size = Either(Float, String, default="1em", help="""
    The size of the icon. This can be either a number of pixels, or a CSS
    length string (see https://developer.mozilla.org/en-US/docs/Web/CSS/length).
    """)

class BuiltinIcon(Icon):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, icon_name: Init[str] = Intrinsic, **kwargs) -> None:
        super().__init__(icon_name=icon_name, **kwargs)

    icon_name = Required(String, help="""
    """)

    color = Color(default="gray", help="""
    """)

class TablerIcon(Icon):
    """ """

    # explicit __init__ to support Init signatures
    def __init__(self, icon_name: Init[str] = Intrinsic, **kwargs) -> None:
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
