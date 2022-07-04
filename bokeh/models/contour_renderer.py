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
from ..core.properties import Float, Instance, Seq
from ..core.types import Unknown
from .annotations import ContourColorBar
from .glyphs import MultiLine, MultiPolygons
from .renderers import DataRenderer, GlyphRenderer
from .sources import ColumnDataSource
from .tickers import FixedTicker

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
    ''' Renderer for contour plots composed of filled polygons and/or lines.

    Rather than create these manually it is usually better to use
    ``figure.contour`` instead.
    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    line_renderer = Instance(GlyphRenderer, default=_DEFAULT_CONTOUR_LINE_RENDERER, help="""
    Glyph renderer used for contour lines.
    """)

    fill_renderer = Instance(GlyphRenderer, default=_DEFAULT_CONTOUR_FILL_RENDERER, help="""
    Glyph renderer used for filled contour polygons.
    """)

    levels = Seq(Float, default=[], help="""
    Levels at which the contours are calculated.
    """)

    def __setattr__(self, name: str, value: Unknown) -> None:
        if name == "data":
            fill_data, line_data = value

            if fill_data:
                # Copy fill and hatch properties from old to new data source
                old_fill_data = self.fill_renderer.data_source.data
                for name in old_fill_data.keys():
                    if name not in ("xs", "ys", "lower_levels", "upper_levels"):
                        fill_data[name] = old_fill_data[name]
                self.fill_renderer.data_source.data = fill_data
            else:
                self.fill_renderer.data_source.data = dict(xs=[], ys=[], lower_levels=[], upper_levels=[])

            if line_data:
                # Copy line properties from old to new data source
                old_line_data = self.line_renderer.data_source.data
                for name in old_line_data.keys():
                    if name not in ("xs", "ys", "levels"):
                        line_data[name] = old_line_data[name]
                self.line_renderer.data_source.data = line_data
            else:
                self.line_renderer.data_source.data = dict(xs=[], ys=[], levels=[])
        else:
            super().__setattr__(name, value)

    def construct_color_bar(self, **kwargs) -> ContourColorBar:
        ''' Construct and return a new ``ContourColorBar`` for this ``ContourRenderer``.

        The color bar will use the same fill, hatch and line visual properties
        as the ContourRenderer. Extra keyword arguments may be passed in to
        control ``BaseColorBar`` properties such as `title`.
        '''
        return ContourColorBar(
            fill_renderer=self.fill_renderer,
            line_renderer=self.line_renderer,
            levels=self.levels,
            ticker=FixedTicker(ticks=self.levels),
            **kwargs,
        )

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
