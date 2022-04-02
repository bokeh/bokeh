#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Models (mostly base classes) for the various kinds of renderer
types that Bokeh supports.

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

# Bokeh imports
from ..core.properties import (
    Any,
    ColumnData,
    Dict,
    Instance,
    String,
)
from ..core.types import Unknown
from .annotations import ColorBar
from .glyphs import (
    MultiLine,
    MultiPolygons,
)
from .mappers import ColorMapper
from .renderers import DataRenderer, GlyphRenderer
from .sources import ColumnDataSource
from .tickers import Ticker

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ContourRenderer',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

_DEFAULT_CONTOUR_LINE_RENDERER = lambda: GlyphRenderer(
    glyph=MultiLine(), data_source=ColumnDataSource(data=dict())
)

_DEFAULT_CONTOUR_FILL_RENDERER = lambda: GlyphRenderer(
    glyph=MultiPolygons(), data_source=ColumnDataSource(data=dict())
)

class ContourRenderer(DataRenderer):
    '''
    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    line_renderer = Instance(GlyphRenderer, default=_DEFAULT_CONTOUR_LINE_RENDERER, help="""
    """)

    fill_renderer = Instance(GlyphRenderer, default=_DEFAULT_CONTOUR_FILL_RENDERER, help="""
    """)

    data = Dict(String, ColumnData(keys_type=String, values_type=Any))

    ticker = Instance(Ticker)

    color_mapper = Instance(ColorMapper)

    def __setattr__(self, name: str, value: Unknown) -> None:
        super().__setattr__(name, value)

        if name == "data":
            # Should check these are set first.
            self.fill_renderer.data_source.data = value["fill_data"]
            self.line_renderer.data_source.data = value["line_data"]

    def color_bar(self) -> ColorBar:
        #### Should accept other kwargs?????
        return ColorBar(color_mapper=self.color_mapper, ticker=self.ticker)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
