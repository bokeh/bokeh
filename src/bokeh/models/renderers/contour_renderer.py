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

# pyright: reportAbstractUsage=false, reportArgumentType=false, reportAttributeAccessIssue=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from typing import TYPE_CHECKING, Sequence, Unpack

from ...core.property.container import Seq
from ...core.property.instance import Instance
from ...core.property.numeric import Float
from ._glyph_attachment import ContourLabels
from .glyph_renderer import GlyphRenderer
from .renderer import DataRenderer

if TYPE_CHECKING:
    from ..._specs import NullStringSpec
    from ...plotting.contour import ContourData
    from ..annotations import ContourColorBar
    from ..formatters import TickFormatter
    from ._glyph_attachment import _ContourLabelStyle

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

    def add_labels(
        self,
        text: NullStringSpec = None,
        *,
        formatter: TickFormatter | None = None,
        positions: str | Sequence[float] | None = None,
        label_all_paths: bool = False,
        inline_gap: bool = False,
        gap_padding: float = 2,
        **style: Unpack[_ContourLabelStyle],
    ) -> ContourLabels:
        """Add labels to contour lines and return their label model.

        By default each level is formatted to three significant digits. Pass a
        :class:`~bokeh.models.TickFormatter` to customize numeric labels.
        Pass a source field name or a literal made with :func:`~bokeh.core.properties.value`
        to supply custom text.

        Labels follow the mapped lines and stay upright. Automatic placement
        favors horizontal sections in the frame and skips a label when no
        candidate fits without overlap. Disconnected pieces of a level share
        at most one automatic label by default. Set ``label_all_paths=True``
        to try to label each visible path. Pass a sequence of screen-space path
        length fractions to use the same positions for every level, or a
        source column name with a sequence per level.

        Fractions run from the first stored vertex (0) to the last (1) in
        contour traversal order. They measure the full mapped path, including
        portions outside the plot frame. Lengths of disconnected pieces are
        added together, excluding the gaps between them. For a closed contour,
        the starting point depends on the stored vertex order.

        Text properties such as ``text_font_size`` and ``text_color`` style the
        labels. The default background is white. With ``inline_gap=True``,
        labels have a transparent background and the contour strokes are
        clipped beneath them, with ``gap_padding`` pixels around the text.
        Inline gaps work on canvas and WebGL plots. SVG draws text over
        continuous strokes. Pass ``background_fill_color`` and
        ``background_fill_alpha`` to customize the background. A color of
        ``None`` makes the background transparent.
        """
        if "background_fill_color" not in style:
            style["background_fill_color"] = None if inline_gap else "white"
        labels = ContourLabels(
            text=text, positions=positions, label_all_paths=label_all_paths, inline_gap=inline_gap,
            gap_padding=gap_padding, **style,
        )
        if formatter is not None:
            labels.formatter = formatter
        self.line_renderer.attachments = [*self.line_renderer.attachments, labels]
        return labels

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
