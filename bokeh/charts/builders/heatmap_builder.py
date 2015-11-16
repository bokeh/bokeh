"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the HeatMap class which lets you build your HeatMap charts just passing
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
from __future__ import absolute_import, print_function, division

from ..builder import XYBuilder, create_and_build
from ..stats import Bins
from ..properties import Dimension
from ..operations import Aggregate
from ..attributes import ColorAttr
from ...models import HoverTool
from ..glyphs import HeatmapGlyph
from ...properties import Float, String

from bokeh.palettes import Blues6

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def HeatMap(data, x=None, y=None, values=None, stat='count', xscale="categorical",
            yscale="categorical", xgrid=False, ygrid=False, hover_tool=True, **kw):
    """ Create a HeatMap chart using :class:`HeatMapBuilder <bokeh.charts.builder.heatmap_builder.HeatMapBuilder>`
    to render the geometry from values.

    A HeatMap is a 3 Dimensional chart that crosses two dimensions, then aggregates
    values if there are multiple that correspond to the intersection of the horizontal
    and vertical dimensions. The value that falls at the intersection is then mapped to a
    color in a palette. All values that map to the positions on the chart are binned into
    the same amount of bins as there are colors in the pallete.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.

    In addition the the parameters specific to this chart,
    :ref:`userguide_charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        from collections import OrderedDict
        from bokeh.charts import HeatMap, output_file, show

        # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
        xyvalues = OrderedDict()
        xyvalues['apples'] = [4,5,8]
        xyvalues['bananas'] = [1,2,4]
        xyvalues['pears'] = [6,5,4]

        hm = HeatMap(xyvalues, title='Fruits')

        output_file('heatmap.html')
        show(hm)

    """
    kw['x'] = x
    kw['y'] = y
    kw['values'] = values
    kw['stat'] = stat
    chart = create_and_build(
        HeatMapBuilder, data, xscale=xscale, yscale=yscale,
        xgrid=xgrid, ygrid=ygrid, **kw
    )

    # set stat name for non-agg data
    if stat is None:
        stat = 'value'

    if hover_tool:
        chart.add_tools(HoverTool(tooltips=[(stat, "@values")]))
    return chart


class HeatMapBuilder(XYBuilder):
    """This is the HeatMap class and it is in charge of plotting
    HeatMap chart in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (rects) taking the references
    from the source.

    """

    values = Dimension('values')

    dimensions = ['x', 'y', 'values']
    req_dimensions = [['x', 'y'],
                      ['x', 'y', 'values']]

    default_attributes = {'color': ColorAttr(bin=True, palette=Blues6,
                                             sort=True, ascending=False)}

    agg_column = String()

    bin_width = Float(default=1.0)
    bin_height = Float(default=1.0)

    spacing_ratio = Float(default=1.0)

    stat = String(default='sum')

    _bins = []

    def process_data(self):
        """Take the CategoricalHeatMap data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``_yield_renderers`` method.

        """
        for op in self._data.operations:
            if isinstance(op, Bins):
                if op.centers_column == self.x.selection:
                    self.bin_width = op.bin_width
                else:
                    self.bin_height = op.bin_width
                self._bins = op

        if self.stat is not None:
            agg = Aggregate(dimensions=[self.x.selection, self.y.selection],
                            columns=self.values.selection, stat=self.stat)
            self._data._data = agg.apply(self._data._data)
            self.values.selection = agg.agg_column

        self.attributes['color'].setup(data=self._data.source,
                                       columns=self.values.selection)
        self.attributes['color'].add_bin_labels(self._data)

    def yield_renderers(self):
        """Use the rect glyphs to display the categorical heatmap.

        Takes reference points from data loaded at the ColumnDataSurce.
        """
        for group in self._data.groupby(**self.attributes):

            glyph = HeatmapGlyph(x=group.get_values(self.x.selection),
                                 y=group.get_values(self.y.selection),
                                 values=group.get_values(self.values.selection + '_values'),
                                 width=self.bin_width * self.spacing_ratio,
                                 height=self.bin_height * self.spacing_ratio,
                                 line_color=group['color'],
                                 fill_color=group['color'],
                                 label=group.label)

            self.add_glyph(group, glyph)

            for renderer in glyph.renderers:
                yield renderer
