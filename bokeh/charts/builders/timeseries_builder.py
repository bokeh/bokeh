"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the TimeSeries chart, which provides a convenient interface for
generating different charts using series-like data by transforming the data
to a consistent format and producing renderers.
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
    """ Create a timeseries chart using :class:`LineBuilder
    <bokeh.charts.builder.line_builder.LineBuilder>` to produce the renderers from
    the inputs. The timeseries chart acts as a switchboard to produce charts
    for timeseries data with different glyph representations.

    Args:
        data (list(list), numpy.ndarray, pandas.DataFrame, list(pd.Series)): a 2d data
            source with columns of data for each stepped line.
        x (str or list(str), optional): specifies variable(s) to use for x axis
        y (str or list(str), optional): specifies variable(s) to use for y axis
        builder_type (str or `Builder`, optional): the type of builder to use to produce
            the renderers. Supported options are 'line', 'step', or 'point'.

    In addition to the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        import pandas as pd

        from bokeh.charts import TimeSeries, show, output_file
        from bokeh.layouts import column

        # read in some stock data from the Yahoo Finance API
        AAPL = pd.read_csv(
            "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000&d=0&e=1&f=2010",
            parse_dates=['Date'])
        MSFT = pd.read_csv(
            "http://ichart.yahoo.com/table.csv?s=MSFT&a=0&b=1&c=2000&d=0&e=1&f=2010",
            parse_dates=['Date'])
        IBM = pd.read_csv(
            "http://ichart.yahoo.com/table.csv?s=IBM&a=0&b=1&c=2000&d=0&e=1&f=2010",
            parse_dates=['Date'])

        data = dict(
            AAPL=AAPL['Adj Close'],
            Date=AAPL['Date'],
            MSFT=MSFT['Adj Close'],
            IBM=IBM['Adj Close'],
        )

        tsline = TimeSeries(data,
            x='Date', y=['IBM', 'MSFT', 'AAPL'],
            color=['IBM', 'MSFT', 'AAPL'], dash=['IBM', 'MSFT', 'AAPL'],
            title="Timeseries", ylabel='Stock Prices', legend=True)

        tspoint = TimeSeries(data,
            x='Date', y=['IBM', 'MSFT', 'AAPL'],
            color=['IBM', 'MSFT', 'AAPL'], dash=['IBM', 'MSFT', 'AAPL'],
            builder_type='point', title="Timeseries Points",
            ylabel='Stock Prices', legend=True)

        output_file("timeseries.html")

        show(column(tsline, tspoint))

    """

    builder_type = BUILDER_TYPES.get(builder_type, builder_type)
    kws['x'] = x
    kws['y'] = y
    return create_and_build(builder_type, data, **kws)
