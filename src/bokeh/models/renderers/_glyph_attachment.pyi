#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from typing import Sequence, Unpack

from ..._specs import NullStringSpec
from ..._types import Color
from ...core.property_mixins import ScalarTextProps, _ScalarTextPropsInit
from ...model.model import Model, _ModelInit
from ..formatters import TickFormatter

class GlyphAttachment(Model): ...

class _ContourLabelStyle(_ModelInit, _ScalarTextPropsInit, total=False):
    visible: bool
    background_fill_color: Color | None
    background_fill_alpha: float

class _ContourLabelsInit(_ContourLabelStyle, total=False):
    text: NullStringSpec
    formatter: TickFormatter
    positions: Sequence[float] | str | None
    inline_gap: bool
    gap_padding: float

class ContourLabels(GlyphAttachment, ScalarTextProps):
    def __init__(self, **kwargs: Unpack[_ContourLabelsInit]) -> None: ...

    text: NullStringSpec = ...
    formatter: TickFormatter = ...
    positions: Sequence[float] | str | None = ...
    visible: bool = ...
    inline_gap: bool = ...
    gap_padding: float = ...
    background_fill_color: Color | None = ...
    background_fill_alpha: float = ...
