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
from .annotations import ContourColorBar
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

    ticker = Instance(Ticker)

    def __setattr__(self, name: str, value: Unknown) -> None:
        if name == "data":
            # Copy across line/fill/hatch properties.
            if "fill_data" in value:
                new_fill_data = value["fill_data"]
                old_fill_data = self.fill_renderer.data_source.data
                for name in old_fill_data.keys():
                    if name not in ("xs", "ys"):
                        new_fill_data[name] = old_fill_data[name]
                self.fill_renderer.data_source.data = new_fill_data

            if "line_data" in value:
                new_line_data = value["line_data"]
                old_line_data = self.line_renderer.data_source.data
                for name in old_line_data.keys():
                    if name not in ("xs", "ys"):
                        new_line_data[name] = old_line_data[name]
                self.line_renderer.data_source.data = new_line_data
        else:
            super().__setattr__(name, value)

    def color_bar(self) -> ContourColorBar:
        # Should accept other kwargs and pass them through?
        return ContourColorBar(
            ticker=self.ticker,
            fill_renderer=self.fill_renderer,
            line_renderer=self.line_renderer,
        )

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
