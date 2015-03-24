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

try:
    import pandas as pd
except ImportError:
    pd = None

from ..utils import chunk, cycle_colors
from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, DataRange1d, GlyphRenderer, Range1d, DataRange1d
from ...properties import Any, Bool
from ...models.glyphs import Line
from warnings import warn

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def TimeSeries(values, index=None, xscale='datetime', **kws):
    """ Create a timeseries chart using
    :class:`TimeSeriesBuilder <bokeh.charts.builder.timeseries_builder.TimeSeriesBuilder>`
    to render the lines from values and index.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.

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

    return create_and_build(
        TimeSeriesBuilder, values, index=index, xscale=xscale, **kws
    )


class TimeSeriesBuilder(Builder):
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
            # add the original series to _data so it can be found in source
            # and can also be used for tooltips..
            if not col in self._data:
                self._data[col] = values

        if self.x_names == ['x'] and 'x' not in self._data:
            self._data['x'] = self._values_index

    def _set_ranges(self):
        """ Calculate the proper ranges """
        self.x_range = DataRange1d(sources=[self._source.columns(self.x_names[0])])
        y_sources = [self.source.columns("%s" % col) for col in self.y_names]
        self.y_range = DataRange1d(sources=y_sources)

    def _yield_renderers(self):
        """Use the line glyphs to connect the xy points in the time series.

        Takes reference points from the data loaded at the ColumnDataSource.
        """
        colors = cycle_colors(self.y_names, self.palette)

        for color, name in zip(colors, self.y_names):
            glyph = Line(x=self.x_names[0], y=name, line_color=color)
            renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
            self._legends.append((name, [renderer]))
            yield renderer
