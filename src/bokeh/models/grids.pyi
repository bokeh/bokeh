#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from typing import Literal, Sequence, Unpack

# Bokeh imports
from ..core.enums import AutoType as Auto
from ..core.property_mixins import (
    ScalarBandFillProps,
    ScalarBandHatchProps,
    ScalarGridLineProps,
    ScalarMinorGridLineProps,
)
from .axes import Axis
from .renderers.renderer import GuideRenderer, _GuideRendererInit
from .tickers import Ticker

class _GridInit(_GuideRendererInit, total=False):
    dimension: Literal[0, 1]
    bounds: Auto | tuple[float, float]
    cross_bounds: Auto | tuple[float, float]
    axis: Axis | None
    ticker: Ticker | Sequence[float] | None

class Grid(GuideRenderer, ScalarGridLineProps, ScalarMinorGridLineProps, ScalarBandFillProps, ScalarBandHatchProps):
    def __init__(self, **kwargs: Unpack[_GridInit]) -> None: ...

    dimension: Literal[0, 1] = ...
    bounds: Auto | tuple[float, float] = ...
    cross_bounds: Auto | tuple[float, float] = ...
    axis: Axis | None = ...

    @property
    def ticker(self) -> Ticker | None: ...
    @ticker.setter
    def ticker(self, ticker: Ticker | Sequence[float] | None) -> None: ...
