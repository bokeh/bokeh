#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

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
from collections.abc import Sequence
from typing import (
    TYPE_CHECKING,
    Any,
    Literal,
    Type,
)

# External imports
import numpy as np
from typing_extensions import TypeAlias

if TYPE_CHECKING:
    import pandas as pd
    from pandas.core.groupby import GroupBy

# Bokeh imports
from ..core.properties import Datetime
from ..core.property.singletons import Intrinsic
from ..models import (
    Axis,
    CategoricalAxis,
    CategoricalScale,
    ContinuousTicker,
    DataRange1d,
    DatetimeAxis,
    FactorRange,
    Grid,
    LinearAxis,
    LinearScale,
    LogAxis,
    LogScale,
    MercatorAxis,
    Range,
    Range1d,
    Scale,
)

if TYPE_CHECKING:
    from ..models.plots import Plot
    from ..models.text import BaseText

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'get_range',
    'get_scale',
    'process_axis_and_grid',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def get_range(range_input: Range | tuple[float, float] | Sequence[str] | pd.Series[Any] | GroupBy | None) -> Range:
    import pandas as pd
    from pandas.core.groupby import GroupBy

    if range_input is None:
        return DataRange1d()
    if isinstance(range_input, GroupBy):
        return FactorRange(factors=sorted(list(range_input.groups.keys())))
    if isinstance(range_input, Range):
        return range_input
    if isinstance(range_input, pd.Series):
        range_input = range_input.values
    if isinstance(range_input, (Sequence, np.ndarray)):
        if all(isinstance(x, str) for x in range_input):
            return FactorRange(factors=list(range_input))
        if len(range_input) == 2:
            try:
                start, end = range_input
                if start is None:
                    start = Intrinsic
                if end is None:
                    end = Intrinsic
                return Range1d(start=start, end=end)
            except ValueError:  # @mattpap suggests ValidationError instead
                pass
    raise ValueError(f"Unrecognized range input: '{range_input}'")

AxisType: TypeAlias = Literal["linear", "log", "datetime", "mercator", "auto"]
AxisLocation: TypeAlias = Literal["above", "below", "left", "right"]
Dim: TypeAlias = Literal[0, 1]

def get_scale(range_input: Range, axis_type: AxisType | None) -> Scale:
    if isinstance(range_input, (DataRange1d, Range1d)) and axis_type in ["linear", "datetime", "mercator", "auto", None]:
        return LinearScale()
    elif isinstance(range_input, (DataRange1d, Range1d)) and axis_type == "log":
        return LogScale()
    elif isinstance(range_input, FactorRange):
        return CategoricalScale()
    else:
        raise ValueError(f"Unable to determine proper scale for: '{range_input}'")

def process_axis_and_grid(plot: Plot, axis_type: AxisType | None, axis_location: AxisLocation | None,
        minor_ticks: int | Literal["auto"] | None, axis_label: str | BaseText | None, rng: Range, dim: Dim) -> None:
    axiscls, axiskw = _get_axis_class(axis_type, rng, dim)

    if axiscls:
        axis = axiscls(**axiskw)

        if isinstance(axis.ticker, ContinuousTicker):
            axis.ticker.num_minor_ticks = _get_num_minor_ticks(axiscls, minor_ticks)

        if axis_label:
            axis.axis_label = axis_label

        grid = Grid(dimension=dim, axis=axis)
        plot.add_layout(grid, "center")

        if axis_location is not None:
            getattr(plot, axis_location).append(axis)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _get_axis_class(axis_type: AxisType | None, range_input: Range, dim: Dim) -> tuple[Type[Axis] | None, Any]:
    if axis_type is None:
        return None, {}
    elif axis_type == "linear":
        return LinearAxis, {}
    elif axis_type == "log":
        return LogAxis, {}
    elif axis_type == "datetime":
        return DatetimeAxis, {}
    elif axis_type == "mercator":
        return MercatorAxis, dict(dimension='lon' if dim == 0 else 'lat')
    elif axis_type == "auto":
        if isinstance(range_input, FactorRange):
            return CategoricalAxis, {}
        elif isinstance(range_input, Range1d):
            try:
                value = range_input.start
                # Datetime accepts ints/floats as timestamps, but we don't want
                # to assume that implies a datetime axis
                if Datetime.is_timestamp(value):
                    return LinearAxis, {}
                Datetime.validate(Datetime(), value)
                return DatetimeAxis, {}
            except ValueError:
                pass
        return LinearAxis, {}
    else:
        raise ValueError(f"Unrecognized axis_type: '{axis_type!r}'")

def _get_num_minor_ticks(axis_class: Type[Axis], num_minor_ticks: int | Literal["auto"] | None) -> int:
    if isinstance(num_minor_ticks, int):
        if num_minor_ticks <= 1:
            raise ValueError("num_minor_ticks must be > 1")
        return num_minor_ticks
    if num_minor_ticks is None:
        return 0
    if num_minor_ticks == 'auto':
        if axis_class is LogAxis:
            return 10
        return 5

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
