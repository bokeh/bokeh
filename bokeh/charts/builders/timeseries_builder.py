"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Line class which lets you build your Line charts just
passing the arguments to the Chart class and calling the proper functions.
"""
# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------
from __future__ import absolute_import

from ..builder import create_and_build
from .line_builder import LineBuilder, PointSeriesBuilder
from .step_builder import StepBuilder

# -----------------------------------------------------------------------------
# Classes and functions
# -----------------------------------------------------------------------------

BUILDER_TYPES = {
    'line': LineBuilder,
    'step': StepBuilder,
    'point': PointSeriesBuilder
}


def TimeSeries(data=None, x=None, y=None, builder_type=LineBuilder, **kws):
    """ Create a line chart using :class:`TimeSeriesBuilder <bokeh.charts.builder.line_builder.LineBuilder>` to
    render the geometry from values and index.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.
        index (str|1d iterable, optional): can be used to specify a common custom
            index for all data series as an **1d iterable** of any sort that will be used as
            series common index or a **string** that corresponds to the key of the
            mapping to be used as index (and not as data series) if
            area.values is a mapping (like a dict, an OrderedDict
            or a pandas DataFrame)

    In addition the the parameters specific to this chart,
    :ref:`userguide_charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        import numpy as np
        from bokeh.charts import Line, output_file, show

        # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
        xyvalues = np.array([[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]])

        line = Line(xyvalues, title="line", legend="top_left", ylabel='Languages')

        output_file('line.html')
        show(line)

    """

    builder_type = BUILDER_TYPES.get(builder_type, builder_type)
    kws['x'] = x
    kws['y'] = y
    return create_and_build(builder_type, data, **kws)
