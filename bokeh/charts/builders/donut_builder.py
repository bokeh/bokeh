"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the BoxPlot class which lets you build your BoxPlot plots just passing
the arguments to the Chart class and calling the proper functions.
It also add a new chained stacked method.
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

from ..builder import create_and_build, Builder
from ..utils import (build_wedge_source, build_wedge_text_source,
                     add_charts_hover, derive_aggregation)
from ..attributes import ColorAttr, CatAttr
from ...models.sources import ColumnDataSource
from ...models.glyphs import AnnularWedge, Text
from ...models.renderers import GlyphRenderer
from ...models.ranges import Range1d
from ..properties import Dimension
from ...properties import String, Instance, Float, Color, Either, List

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Donut(data, label='index', values=None, xgrid=False,
          ygrid=False, color=None, agg=None, height=400, width=400,
          hover_tool=True, hover_text=None, **kw):
    """ Create a Donut chart containing one or more layers from table-like data.

    Create a donut chart using :class:`DonutBuilder
    <bokeh.charts.builders.donut_builder.DonutBuilder>` to
    render the glyphs from input data and specification. The primary
    use case for the donut chart is to show relative amount each category, within a
    categorical array or multiple categorical arrays, makes up of the whole for some
    array of values.

    Args:
      data (:ref:`userguide_charts_data_types`): the data source for the chart
      values (str, optional): the values to use for producing the boxplot using
        table-like input data
      label (str or list(str), optional): the categorical variable to use for creating
        separate boxes
      color (str or list(str) or bokeh.charts._attributes.ColorAttr, optional): the
        categorical variable or color attribute specification to use for coloring the
        boxes.
      **kw:

    Returns:
        :class:`Chart`: includes glyph renderers that generate Boxes and Whiskers

    Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.sampledata.autompg import autompg as df
        from bokeh.charts import BoxPlot, output_file, show, hplot

        box = BoxPlot(df, values='mpg', label='cyl', title="Auto MPG Box Plot", width=400)
        box2 = BoxPlot(df, values='mpg', label='cyl', color='cyl',
                          title="MPG Box Plot by Cylinder Count", width=400)

        output_file('box.html')
        show(hplot(box, box2))
    """

    kw['label'] = label
    kw['values'] = values
    kw['color'] = color
    kw['xgrid'] = xgrid
    kw['ygrid'] = ygrid
    kw['height'] = height
    kw['width'] = width

    if agg is not None:
        kw['agg'] = agg

    chart = create_and_build(DonutBuilder, data, **kw)

    chart.left[0].visible = False
    chart.below[0].visible = False

    values, agg = derive_aggregation(dim_cols=label, agg_col=values, agg=agg)
    add_charts_hover(chart, use_hover=hover_tool, hover_text=hover_text,
                     values_col=values, agg_text=agg)

    return chart


class DonutBuilder(Builder):
    """Produces layered donut for hierarchical groups of data.

    Handles derivation of chart settings from inputs and assignment of attributes
    to each group of data.

    """

    default_attributes = {'color': ColorAttr(),
                          'label': CatAttr(),
                          'stack': CatAttr()}

    dimensions = ['values']

    values = Dimension('values')

    agg = String(default='sum')

    chart_data = Instance(ColumnDataSource)
    text_data = Instance(ColumnDataSource)

    level_width = Float(default=1.5)
    level_spacing = Either(Float, List(Float), default=0.0)
    text_font_size = String(default='10pt')
    line_color = Color(default='White')

    def setup(self):

        if self.attributes['label'].columns is None:
            self.attributes['label'].setup(data=self._data.source,
                                           columns=self._data.df.columns[0])

        # handle input options where values were provided in simple or pre-aggregated
        # format
        if self.values.selection is None:

            # identify data that was indexed by a groupby operation and setup data/label
            # after this transformation, the rest of the chart is processed as if the
            # inputs were provided as column labels
            if not all([name is None for name in self._data.df.index.names]):
                label_cols = list(self._data.df.index.names)
                self._data._data.reset_index(inplace=True)
                self.attributes['label'].setup(data=self._data.source,
                                               columns=label_cols)

                # find remaining column for pre-aggregated data
                cols = [col for col in self._data.df.columns if col not in
                        label_cols + ['index']]

            # when there is 'index' selection for label, use remaining column as label
            # if the remaining column is an object
            elif self.attributes['label'].columns[0] == 'index':
                cols = [col for col in self._data.df.columns if col not in ['index']]
            else:
                cols = self.attributes['label'].columns

            # setup our selection
            self.values.selection = cols[0]

            if self._data.df[self.values.selection].dtype.name == 'object':
                self.attributes['label'].setup(data=self._data.source,
                                               columns=cols[0])
                self.agg = 'count'

        # infer color specification and stacking
        if self.attributes['color'].columns is None:
            self.attributes['color'].setup(data=self._data.source,
                                           columns=self.attributes['label'].columns[0])

        if self.attributes['stack'].columns is None:
            self.attributes['stack'].setup(data=self._data.source,
                                           columns=self.attributes['label'].columns[0])

    def set_ranges(self):
        rng = (max(self.chart_data.data['level']) + 1.1) * self.level_width
        self.x_range = Range1d(-rng, rng)
        self.y_range = Range1d(-rng, rng)

    def process_data(self):

        # produce polar ranges based on aggregation specification
        polar_data = build_wedge_source(self._data.df,
                                        cat_cols=self.attributes['label'].columns,
                                        agg_col=self.values.selection,
                                        agg=self.agg,
                                        level_width=self.level_width,
                                        level_spacing=self.level_spacing)

        # add placeholder color column that will be assigned colors
        polar_data['color'] = ''

        # set the color based on the assigned color for the group
        for group in self._data.groupby(**self.attributes):
            polar_data.loc[group['stack'], 'color'] = group['color']

        # create the source for the wedges and the text
        self.chart_data = ColumnDataSource(polar_data)
        self.text_data = build_wedge_text_source(polar_data)

    def yield_renderers(self):

        aw = AnnularWedge(x=0, y=0, inner_radius='inners', outer_radius='outers',
                          start_angle='start', end_angle='end', fill_color='color',
                          fill_alpha=0.8, line_color=self.line_color)

        yield GlyphRenderer(data_source=self.chart_data, glyph=aw)

        txt = Text(x="x", y="y", text="text", angle="text_angle",
                   text_align="center", text_baseline="middle",
                   text_font_size=self.text_font_size)

        yield GlyphRenderer(data_source=self.text_data, glyph=txt)
