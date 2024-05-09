#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

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
from ...core.enums import CoordinateUnitsType
from ...core.has_props import abstract
from ...core.properties import Include, NumberSpec, Override
from ...core.property_mixins import FillProps, LineProps
from ...util.deprecation import deprecated
from .. import glyphs
from ..graphics import Marking
from ..renderers import GlyphRenderer
from .common import build_glyph_renderer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Arrow",
    "ArrowHead",
    "NormalHead",
    "OpenHead",
    "TeeHead",
    "VeeHead",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class ArrowHead(Marking):
    ''' Base class for arrow heads.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    size = NumberSpec(default=25, help="""
    The size, in pixels, of the arrow head.
    """)

    # TODO: reversed = Bool(default=False)

class OpenHead(ArrowHead):
    ''' Render an open-body arrow head.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    line_props = Include(LineProps, help="""

    The {prop} values for the arrow head outline.
    """)

class NormalHead(ArrowHead):
    ''' Render a closed-body arrow head.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    line_props = Include(LineProps, help="""
    The {prop} values for the arrow head outline.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the arrow head interior.
    """)

    fill_color = Override(default="black")

class TeeHead(ArrowHead):
    ''' Render a tee-style arrow head.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    line_props = Include(LineProps, help="""
    The {prop} values for the arrow head outline.
    """)

class VeeHead(ArrowHead):
    ''' Render a vee-style arrow head.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    line_props = Include(LineProps, help="""
    The {prop} values for the arrow head outline.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the arrow head interior.
    """)

    fill_color = Override(default="black")

#-----------------------------------------------------------------------------
# Legacy API
#-----------------------------------------------------------------------------

def Arrow(**kwargs: Any) -> GlyphRenderer:
    """ Render a collection of straight arrows between two sets of points.

    """
    deprecated((3, 5, 0), "bokeh.annotations.Arrow", "bokeh.glyphs.ArrowGlyph or figure.arrow()")

    if "x_start" in kwargs:
        kwargs["x0"] = kwargs.pop("x_start")
    if "y_start" in kwargs:
        kwargs["y0"] = kwargs.pop("y_start")
    if "x_end" in kwargs:
        kwargs["x1"] = kwargs.pop("x_end")
    if "y_end" in kwargs:
        kwargs["y1"] = kwargs.pop("y_end")

    if "start_units" in kwargs:
        start_units: CoordinateUnitsType = kwargs.pop("start_units")
        match start_units:
            case "data":
                pass
            case "screen":
                pass
            case "canvas":
                pass


    if "end_units" in kwargs:
        kwargs.pop("end_units")

    if "line_color" not in kwargs:
        kwargs["line_color"] = "black"

    return build_glyph_renderer(glyphs.ArrowGlyph, kwargs)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
