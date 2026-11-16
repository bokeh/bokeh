#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from typing import Any, Sequence, Unpack

from ..._specs import NullStringSpec
from ...plotting.contour import ContourData
from ..annotations import ContourColorBar
from ..formatters import TickFormatter
from ..glyph import Glyph
from ._glyph_attachment import ContourLabels, _ContourLabelStyle
from .glyph_renderer import GlyphRenderer
from .renderer import DataRenderer, _DataRendererInit

class _ContourRendererInit(_DataRendererInit, total=False):
    line_renderer: GlyphRenderer[Glyph]
    fill_renderer: GlyphRenderer[Glyph]
    levels: Sequence[float]

class ContourRenderer(DataRenderer):
    def __init__(self, **kwargs: Unpack[_ContourRendererInit]) -> None: ...

    line_renderer: GlyphRenderer[Glyph] = ...
    fill_renderer: GlyphRenderer[Glyph] = ...
    levels: Sequence[float] = ...

    def set_data(self, data: ContourData) -> None: ...

    def add_labels(
        self,
        text: NullStringSpec = ...,
        *,
        formatter: TickFormatter | None = ...,
        positions: str | Sequence[float] | None = ...,
        label_all_paths: bool = ...,
        inline_gap: bool = ...,
        gap_padding: float = ...,
        **style: Unpack[_ContourLabelStyle],
    ) -> ContourLabels: ...

    def construct_color_bar(self, **kwargs: Any) -> ContourColorBar: ...
