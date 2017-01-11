"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Donut builder which lets you build your Donut plots just passing
the arguments to the Chart class and calling the proper functions.
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
                     build_agg_tooltip, derive_aggregation)
from ..attributes import ColorAttr, CatAttr
from ...models import HoverTool
from ...models.sources import ColumnDataSource
from ...models.glyphs import AnnularWedge, Text
from ...models.renderers import GlyphRenderer
from ...models.ranges import Range1d
from ..properties import Dimension
from ...core.properties import String, Instance, Float, Color, Either, List

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Donut(data, label='index', values=None,  color=None, agg=None,
          hover_tool=True, hover_text=None, plot_height=400, plot_width=400,
          xgrid=False, ygrid=False, **kw):
    """ Create a Donut chart containing one or more layers from table-like data.

    Create a donut chart using :class:`DonutBuilder
    <bokeh.charts.builders.donut_builder.DonutBuilder>` to
    render the glyphs from input data and specification. The primary
    use case for the donut chart is to show relative amount each category, within a
    categorical array or multiple categorical arrays, makes up of the whole for some
    array of values.

    Args:
        data (:ref:`userguide_charts_data_types`): the data source for the chart
            label (str or list(str), optional): the categorical variable to use for
            creating separate boxes
        values (str, optional): the values to use for producing the boxplot using
            table-like input data
        color (str or list(str) or bokeh.charts._attributes.ColorAttr, optional): the
            categorical variable or color attribute specification to use for coloring
            the wedges
        agg (str, optional): how the values associated with a wedge should be
            aggregated
        hover_tool (bool, optional): whether to show the value of the
            wedge when hovering
        hover_text (str, optional): provide an alternative string to use to label the
            value shown with the hover tool
        **kw:

    In addition to the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    Returns:
        :class:`Chart`: includes glyph renderers that generate the wedges the make up
        the donut(s)

    Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.charts import Donut, show, output_file
        from bokeh.charts.utils import df_from_json
        from bokeh.sampledata.olympics2014 import data

        import pandas as pd

        # utilize utility to make it easy to get json/dict data converted to a dataframe
        df = df_from_json(data)

        # filter by countries with at least one medal and sort by total medals
        df = df[df['total'] > 8]
        df = df.sort_values(by="total", ascending=False)
        df = pd.melt(df, id_vars=['abbr'],
                     value_vars=['bronze', 'silver', 'gold'],
                     value_name='medal_count', var_name='medal')

        # original example
        d = Donut(df, label=['abbr', 'medal'], values='medal_count',
                  text_font_size='8pt', hover_text='medal_count')

        output_file("donut.html")

        show(d)

    """

    kw['label'] = label
    kw['values'] = values
    kw['color'] = color
    kw['xgrid'] = xgrid
    kw['ygrid'] = ygrid
    kw['plot_height'] = plot_height
    kw['plot_width'] = plot_width

    if agg is not None:
        kw['agg'] = agg

    chart = create_and_build(DonutBuilder, data, **kw)

    chart.left[0].visible = False
    chart.below[0].visible = False

    values, agg = derive_aggregation(dim_cols=label, agg_col=values, agg=agg)
    if hover_tool:
        tooltip = build_agg_tooltip(hover_text=hover_text, aggregated_col=values,
                                    agg_text=agg)
        chart.add_tools(HoverTool(tooltips=[tooltip]))

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
