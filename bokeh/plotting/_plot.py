#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from collections.abc import Sequence

# External imports
import numpy as np

# Bokeh imports
from ..core.properties import Datetime
from ..models import (
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
)
from ..util.dependencies import import_optional

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

pd = import_optional('pandas')

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

def get_range(range_input):
    if range_input is None:
        return DataRange1d()
    if pd and isinstance(range_input, pd.core.groupby.GroupBy):
        return FactorRange(factors=sorted(list(range_input.groups.keys())))
    if isinstance(range_input, Range):
        return range_input
    if pd and isinstance(range_input, pd.Series):
        range_input = range_input.values
    if isinstance(range_input, (Sequence, np.ndarray)):
        if all(isinstance(x, str) for x in range_input):
            return FactorRange(factors=list(range_input))
        if len(range_input) == 2:
            try:
                return Range1d(start=range_input[0], end=range_input[1])
            except ValueError:  # @mattpap suggests ValidationError instead
                pass
    raise ValueError("Unrecognized range input: '%s'" % str(range_input))

def get_scale(range_input, axis_type):
    if isinstance(range_input, (DataRange1d, Range1d)) and axis_type in ["linear", "datetime", "mercator", "auto", None]:
        return LinearScale()
    elif isinstance(range_input, (DataRange1d, Range1d)) and axis_type == "log":
        return LogScale()
    elif isinstance(range_input, FactorRange):
        return CategoricalScale()
    else:
        raise ValueError("Unable to determine proper scale for: '%s'" % str(range_input))

def process_axis_and_grid(plot, axis_type, axis_location, minor_ticks, axis_label, rng, dim):
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

def _get_axis_class(axis_type, range_input, dim):
    if axis_type is None:
        return None, {}
    elif axis_type == "linear":
        return LinearAxis, {}
    elif axis_type == "log":
        return LogAxis, {}
    elif axis_type == "datetime":
        return DatetimeAxis, {}
    elif axis_type == "mercator":
        return MercatorAxis, {'dimension': 'lon' if dim == 0 else 'lat'}
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
        raise ValueError("Unrecognized axis_type: '%r'" % axis_type)

def _get_num_minor_ticks(axis_class, num_minor_ticks):
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
