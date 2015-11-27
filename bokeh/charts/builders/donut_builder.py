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
from ..utils import title_from_columns
from ..attributes import ColorAttr, CatAttr
from ...models.sources import ColumnDataSource
from ...models.glyphs import AnnularWedge
from ...models.renderers import GlyphRenderer
from ...models.ranges import Range1d
from ..properties import Dimension
from ...properties import String, Instance, Float
from ..utils import cat_to_polar

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Donut(data, label=None, values=None, xgrid=False,
          ygrid=False, color=None, agg='sum', height=400, width=400, **kw):
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
    kw['agg'] = agg
    kw['height'] = height
    kw['width'] = width

    chart = create_and_build(DonutBuilder, data, **kw)

    chart.left[0].visible = False
    chart.below[0].visible = False

    return chart


class DonutBuilder(Builder):
    """Produces layered donut for hierarchical groups of data.

    Handles derivation of chart settings from inputs and assignment of attributes
    to each group of data.

    """

    default_attributes = {'color': ColorAttr(),
                          'group': CatAttr(),
                          'label': CatAttr(),
                          'stack': CatAttr()}

    dimensions = ['values']

    values = Dimension('values')

    agg = String()

    chart_data = Instance(ColumnDataSource)
    level_width = Float(default=0.5)
    level_spacing = Float(default=0.0)

    def setup(self):
        if self.ylabel is None:
            self.ylabel = self.values.selected_title

        if self.xlabel is None:
            self.xlabel = title_from_columns(self.attributes['label'].columns)

    def set_ranges(self):
        rng = (max(self.chart_data.data['level']) + 1.1) * self.level_width
        self.x_range = Range1d(-rng, rng)
        self.y_range = Range1d(-rng, rng)

    def yield_renderers(self):

        # produce polar ranges based on aggregation specification
        polar_data = cat_to_polar(self._data.df,
                                  cat_cols=self.attributes['label'].columns,
                                  agg_col=self.values.selection,
                                  agg=self.agg)

        # add placeholder color column that will be assigned colors
        polar_data['color'] = ''

        # sort the index to avoid performance warning (might alter chart)
        polar_data.sortlevel(inplace=True)

        # set the color based on the assigned color for the group
        for group in self._data.groupby(**self.attributes):
            polar_data.loc[group['stack'], 'color'] = group['color']

        # add columns for the inner and outer size of the wedge glyph
        polar_data['inners'] = polar_data['level'] * self.level_width
        polar_data['outers'] = polar_data['inners'] + self.level_width

        # add spacing based on input settings
        polar_data.ix[polar_data['level'] > 0, 'inners'] += self.level_spacing

        data = ColumnDataSource(polar_data)
        self.chart_data = data

        glyph = AnnularWedge(x=0, y=0, inner_radius='inners', outer_radius='outers',
                        start_angle='start', end_angle='end', fill_color='color',
                        fill_alpha=0.8)

        yield GlyphRenderer(data_source=data, glyph=glyph)
