"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the TimeSeries class which lets you build your TimeSeries charts just
passing the arguments to the Chart class and calling the proper functions.
"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from __future__ import absolute_import
from six import string_types

import datetime as dt
try:
    import pandas as pd
except ImportError:
    pd = None

from .._builder import Builder, create_and_build, TabularSourceBuilder
from ...models.glyphs import Line

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def TimeSeries(data, time, values=None, orientation="horizontal", **kws):
    """ Create a timeseries chart using
    :class:`TimeSeriesBuilder <bokeh.charts.builder.timeseries_builder.TimeSeriesBuilder>`
    to render the lines from values and index.

    Args:
        data (iterable): iterable 2d representing the data series
            values matrix.
        time (str | iterable(str) | iterable(iterable) | iterable(dt)):
        values (str | iterable(str)):
        orientation (str): values: "horizontal" or "vertical"

    In addition the the parameters specific to this chart,
    :ref:`charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        from collections import OrderedDict
        import datetime
        from bokeh.charts import TimeSeries, output_file, show

        # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
        now = datetime.datetime.now()
        delta = datetime.timedelta(minutes=1)
        dts = [now + delta*i for i in range(5)]

        xyvalues = OrderedDict({'Date': dts})
        y_python = xyvalues['python'] = [2, 3, 7, 5, 26]
        y_pypy = xyvalues['pypy'] = [12, 33, 47, 15, 126]
        y_jython = xyvalues['jython'] = [22, 43, 10, 25, 26]

        ts = TimeSeries(xyvalues, index='Date', title="TimeSeries", legend="top_left",
                ylabel='Languages')

        output_file('timeseries.html')
        show(ts)

    """
    xscale=kws.pop('xscale', 'datetime')
    index = None

    if not isinstance(time, string_types) and isinstance(time[0], dt.datetime):
        index, time = time, None

    # x_names = time
    # y_names = values
    return create_and_build(
        TimeSeriesBuilder, data, x=time, y=values, xscale=xscale, index=index, **kws
    )


class TimeSeriesBuilder(TabularSourceBuilder):
    """This is the TimeSeries class and it is in charge of plotting
    TimeSeries charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed lines taking the references from the source.

    """

    def _process_data(self):
        """Take the x/y data from the timeseries values.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the points to be used by
        the line glyph inside the ``_yield_renderers`` method.

        """
        # necessary to make all formats and encoder happy with array, blaze, ...
        for col, values in self._values.items():

            if col not in self._data:
                self._data[col] = values

        for xname in self.x:
            if xname not in self._data:
                self._data[xname] = self._values_index

    def _create_glyph(self, xname, yname, color):
        return Line(x=xname, y=yname, line_color=color)
