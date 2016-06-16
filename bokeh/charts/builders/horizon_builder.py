"""This is the Bokeh charts interface. It gives you a high level API
to build complex plot is a simple way.

This is the Horizon class which lets you build your Horizon charts
just passing the arguments to the Chart class and calling the proper
functions.
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

from bokeh.charts.builder import create_and_build
from bokeh.charts.glyphs import HorizonGlyph
from .line_builder import LineBuilder
from ...core.properties import Float, Int, List, string_types, String, Color, Bool
from ..attributes import ColorAttr, IdAttr
from ...models.sources import ColumnDataSource
from ...models.axes import CategoricalAxis
from ...models.ranges import FactorRange, DataRange1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Horizon(data=None, x=None, y=None, series=None, **kws):
    """ Create a horizon chart using :class:`HorizonBuilder
    <bokeh.charts.builders.scatter_builder.HorizonBuilder>`
    to render the geometry from values.

    Args:
        data (:ref:`userguide_charts_data_types`): table-like data
        x (str or list(str), optional): the column label to use for the x dimension
        y (str or list(str), optional): the column label to use for the y dimension

    In addition to the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    Returns:
        :class:`Chart`: includes glyph renderers that generate the scatter points

    Examples:

    .. bokeh-plot::
        :source-position: above

        import pandas as pd
        from bokeh.charts import Horizon, output_file, show

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

        data = dict([
            ('AAPL', AAPL['Adj Close']),
            ('Date', AAPL['Date']),
            ('MSFT', MSFT['Adj Close']),
            ('IBM', IBM['Adj Close'])]
        )

        hp = Horizon(data, x='Date', plot_width=800, plot_height=300,
                     title="horizon plot using stock inputs")

        output_file("horizon.html")

        show(hp)

    """
    kws['x'] = x
    kws['y'] = y
    kws['series'] = series

    tools = kws.get('tools', True)
    if tools == True:
        tools = "save,reset"
    elif isinstance(tools, string_types):
        tools = tools.replace('pan', '')
        tools = tools.replace('wheel_zoom', '')
        tools = tools.replace('box_zoom', '')
        tools = tools.replace(',,', ',')
    kws['tools'] = tools

    chart = create_and_build(HorizonBuilder, data, **kws)

    # Hide numerical axis
    chart.left[0].visible = False

    # Add the series names to the y axis
    chart.extra_y_ranges = {"series": FactorRange(factors=chart._builders[0].series_names)}
    chart.add_layout(CategoricalAxis(y_range_name="series"), 'left')
    return chart


class HorizonBuilder(LineBuilder):
    """Produces glyph renderers representing a horizon chart from many input types.

    The builder handles ingesting the data, deriving settings when not provided,
    building the renderers, then setting ranges, and modifying the chart as needed.

    """

    # class configuration
    glyph = HorizonGlyph
    default_attributes = {'color': ColorAttr(sort=False),
                          'series': IdAttr(sort=False)}

    # primary input properties
    pos_color = Color("#006400", help="""
    The color of the positive folds. (default: "#006400")
    """)

    neg_color = Color("#6495ed", help="""
    The color of the negative folds. (default: "#6495ed")
    """)

    num_folds = Int(3, help="""
    The number of folds stacked on top of each other. (default: 3)
    """)

    flip_neg = Bool(default=True, help="""When True, the negative values will be
    plotted as their absolute value, then their individual axes is flipped. If False,
    then the negative values will still be taken as their absolute value, but the base
    of their shape will start from the same origin as the positive values.
    """)

    # derived properties
    series_count = Int(help="""Count of the unique series names.""")
    bins = List(Float, help="""The binedges calculated from the number of folds,
    and the maximum value of the entire source data.""")
    series_column = String(help="""The column that contains the series names.""")
    fold_height = Float(help="""The size of the bin.""")

    def setup(self):
        super(HorizonBuilder, self).setup()

        # collect series names and columns selected to color by
        if self.attributes['series'].columns is None:
            self.series_column = self.attributes['color'].columns[0]
        else:
            self.series_column = self.attributes['series'].columns[0]

        if len(self.series_names) == 0:
            self.set_series(self.series_column)

        self.series_count = len(self.series_names)

    def process_data(self):
        super(HorizonBuilder, self).process_data()

        # calculate group attributes, useful for each horizon glyph
        self.fold_height = max(self.y.max, abs(self.y.min))/self.num_folds
        self.bins = [bin_id * self.fold_height for bin_id in range(self.num_folds + 1)]

        # manually set attributes to have constant color
        ds = ColumnDataSource(self._data.df)
        self.attributes['series'].setup(data=ds, columns=self.series_column)
        self.attributes['color'].setup(data=ds, columns=self.pos_color)

    def set_ranges(self):
        super(HorizonBuilder, self).set_ranges()
        self.x_range = DataRange1d(range_padding=0)
        self.y_range.start = 0
        self.y_range.end = self.y.max
