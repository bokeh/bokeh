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
from ...models import ColumnDataSource, DataRange1d, GlyphRenderer, Range1d
from ...models.glyphs import Line
from ...properties import Any

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def TimeSeries(values, index=None, xscale='datetime', **kws):
    """ Create a timeseries chart using
    :class:`TimeSeriesBuilder <bokeh.charts.builder.timeseries_builder.TimeSeriesBuilder>`
    to render the lines from values and index.

    Args:
        values (iterable): a 2d iterable containing the values.  Can be anything that 
            can be converted to a 2d array, and which is the x (time) axis is determined
            by ``index``, while the others are interpreted as y values. 
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

    index = Any(help="""
    An index to be used for all data series as follows:

    - A 1d iterable of any sort that will be used as
        series common index

    - As a string that corresponds to the key of the
        mapping to be used as index (and not as data
        series) if area.values is a mapping (like a dict,
        an OrderedDict or a pandas DataFrame)

    """)

    def _process_data(self):
        """Take the x/y data from the timeseries values.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the points to be used by
        the line glyph inside the ``_yield_renderers`` method.

        """
        self._data = dict()

        # list to save all the attributes we are going to create
        self._attr = []
        # necessary to make all formats and encoder happy with array, blaze, ...
        xs = list([x for x in self._values_index])
        for col, values in self._values.items():
            if isinstance(self.index, string_types) \
                and col == self.index:
                continue

            # save every the groups available in the incomming input
            self._groups.append(col)
            self.set_and_get("x_", col, xs)
            self.set_and_get("y_", col, values)

    def _set_sources(self):
        """Push the TimeSeries data into the ColumnDataSource and
        calculate the proper ranges.
        """
        self._source = ColumnDataSource(self._data)
        self.x_range = DataRange1d()
        y_names = self._attr[1::2]
        endy = max(max(self._data[i]) for i in y_names)
        starty = min(min(self._data[i]) for i in y_names)
        self.y_range = Range1d(
            start=starty - 0.1 * (endy - starty),
            end=endy + 0.1 * (endy - starty)
        )

    def _yield_renderers(self):
        """Use the line glyphs to connect the xy points in the time series.

        Takes reference points from the data loaded at the ColumnDataSource.
        """
        self._duplet = list(chunk(self._attr, 2))
        colors = cycle_colors(self._duplet, self.palette)

        for i, (x, y) in enumerate(self._duplet, start=1):
            glyph = Line(x=x, y=y, line_color=colors[i - 1])
            renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
            self._legends.append((self._groups[i-1], [renderer]))
            yield renderer
