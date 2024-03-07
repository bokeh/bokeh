#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Renderer for contour lines and filled polygons.

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
from typing import TYPE_CHECKING

# Bokeh imports
from ...core.properties import Float, Instance, Seq
from .glyph_renderer import GlyphRenderer
from .renderer import DataRenderer

if TYPE_CHECKING:
    from ...plotting.contour import ContourData
    from ..annotations import ContourColorBar

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'ContourRenderer',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class ContourRenderer(DataRenderer):
    ''' Renderer for contour plots composed of filled polygons and/or lines.

    Rather than create these manually it is usually better to use
    :func:`~bokeh.plotting.figure.contour` instead.
    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    line_renderer = Instance(GlyphRenderer, help="""
    Glyph renderer used for contour lines.
    """)

    fill_renderer = Instance(GlyphRenderer, help="""
    Glyph renderer used for filled contour polygons.
    """)

    levels = Seq(Float, default=[], help="""
    Levels at which the contours are calculated.
    """)

    def set_data(self, data: ContourData) -> None:
        ''' Set the contour line and filled polygon data to render.

        Accepts a :class:`~bokeh.plotting.contour.ContourData` object, such as
        is returned from :func:`~bokeh.plotting.contour.contour_data`.

        '''
        if data.fill_data:
            # Convert dataclass to dict to add new fields and put into CDS.
            fill_data = data.fill_data.asdict()
            # Copy fill and hatch properties from old to new data source
            old_fill_data = self.fill_renderer.data_source.data
            for name in old_fill_data.keys():
                if name not in ("xs", "ys", "lower_levels", "upper_levels"):
                    fill_data[name] = old_fill_data[name]
            self.fill_renderer.data_source.data = fill_data
        else:
            self.fill_renderer.data_source.data = dict(xs=[], ys=[], lower_levels=[], upper_levels=[])

        if data.line_data:
            # Convert dataclass to dict to add new fields and put into CDS.
            line_data = data.line_data.asdict()
            # Copy line properties from old to new data source
            old_line_data = self.line_renderer.data_source.data
            for name in old_line_data.keys():
                if name not in ("xs", "ys", "levels"):
                    line_data[name] = old_line_data[name]
            self.line_renderer.data_source.data = line_data
        else:
            self.line_renderer.data_source.data = dict(xs=[], ys=[], levels=[])

    def construct_color_bar(self, **kwargs) -> ContourColorBar:
        ''' Construct and return a new ``ContourColorBar`` for this ``ContourRenderer``.

        The color bar will use the same fill, hatch and line visual properties
        as the ContourRenderer. Extra keyword arguments may be passed in to
        control ``BaseColorBar`` properties such as `title`.
        '''
        from ..annotations import ContourColorBar
        from ..tickers import FixedTicker
        return ContourColorBar(
            fill_renderer=self.fill_renderer,
            line_renderer=self.line_renderer,
            levels=self.levels,
            ticker=FixedTicker(ticks=self.levels),
            **kwargs,
        )

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
