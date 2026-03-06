#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Literal

# Bokeh imports
from ..core.enums import AutoType as Auto
from ..core.property_mixins import (
    ScalarBandFillProps,
    ScalarBandHatchProps,
    ScalarGridLineProps,
    ScalarMinorGridLineProps,
)
from .axes import Axis
from .renderers import GuideRenderer
from .tickers import Ticker

@dataclass
class Grid(GuideRenderer, ScalarGridLineProps, ScalarMinorGridLineProps, ScalarBandFillProps, ScalarBandHatchProps):

    dimension: Literal[0, 1] = ...

    bounds: Auto | tuple[float, float] = ...

    cross_bounds: Auto | tuple[float, float] = ...

    axis: Axis | None = ...

    ticker: Ticker | None = ...
