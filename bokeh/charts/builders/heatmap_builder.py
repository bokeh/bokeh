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
from ..glyphs import BinGlyph
from ..utils import build_agg_tooltip
from ...core.properties import Float, String

from bokeh.palettes import Blues6

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def HeatMap(data, x=None, y=None, values=None, stat='count', xgrid=False, ygrid=False,
            hover_tool=True, hover_text=None, **kw):
    """ Represent 3 dimensions in a HeatMap chart using x, y, and values.

    Uses the :class:`~bokeh.charts.builders.heatmap_builder.HeatMapBuilder`
    to render the geometry from values.

    A HeatMap is a 3 Dimensional chart that crosses two dimensions, then aggregates
    values  that correspond to the intersection of the horizontal and vertical
    dimensions. The value that falls at the intersection is then mapped to a
    color in a palette by default. All values that map to the positions on the chart are
    binned by the number of discrete colors in the palette.

    Args:
        data (:ref:`userguide_charts_data_types`): the data source for the chart
        x (str or list(str), optional): specifies variable(s) to use for x axis
        y (str or list(str), optional): specifies variable(s) to use for y axis
        values (str, optional): the values to use for producing the histogram using
            table-like input data
        stat (str, optional): the aggregation to use. Defaults to count. If provided
            `None`, then no aggregation will be attempted. This is useful for cases
            when the values have already been aggregated.
        hover_tool (bool, optional): whether to show the hover tool. Defaults to `True`
        hover_text (str, optional): a string to place beside the value in the hover
            tooltip. Defaults to `None`. When `None`, a hover_text will be derived from
            the aggregation and the values column.

    In addition to the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        from bokeh.charts import HeatMap, output_file, show

        # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
        data = {'fruit': ['apples']*3 + ['bananas']*3 + ['pears']*3,
                'fruit_count': [4, 5, 8, 1, 2, 4, 6, 5, 4],
                'sample': [1, 2, 3]*3}

        hm = HeatMap(data, x='fruit', y='sample', values='fruit_count',
                     title='Fruits', stat=None)

        output_file('heatmap.html')
        show(hm)

    """
    kw['x'] = x
    kw['y'] = y
    kw['values'] = values
    kw['stat'] = stat
    chart = create_and_build(HeatMapBuilder, data, xgrid=xgrid, ygrid=ygrid, **kw)

    if hover_tool:
        tooltip = build_agg_tooltip(hover_text=hover_text, aggregated_col=values,
                                    agg_text=stat)
        chart.add_tooltips([tooltip])

    return chart


class HeatMapBuilder(XYBuilder):
    """Assists in producing glyphs required to represent values by a glyph attribute.

    Primary use case is to display the 3rd dimension of a value by binning and
    aggregating as needed and assigning the results to color. This color is represented
    on a glyph that is positioned by the x and y dimensions.

    """
    values = Dimension('values')

    dimensions = ['x', 'y', 'values']
    req_dimensions = [['x', 'y'],
                      ['x', 'y', 'values']]

    """
    The heatmap uses color to bin the values and assign discrete colors. The
    values are sorted descending and assigned to the palette by default.
    """
    default_attributes = {'color': ColorAttr(bin=True, palette=Blues6,
                                             sort=True, ascending=False)}

    bin_width = Float(default=1.0, help="""
        A derived property that is used to size the glyph in width.
        """)

    bin_height = Float(default=1.0, help="""
        A derived property that is used to size the glyph in height.
        """)

    spacing_ratio = Float(default=0.95, help="""
        Multiplied by the bin height and width to shrink or grow the relative size
        of the glyphs. The closer to 0 this becomes, the amount of space between the
        glyphs will increase. When above 1.0, the glyphs will begin to overlap.
        """)

    stat = String(default='sum', help="""
        The stat to be applied to the values that fall into each x and y intersection.
        When stat is set to `None`, then no aggregation will occur.
        """)

    def setup(self):

        # sort the legend by the color selection, reversed compared to how the values
        # were assigned to color
        if self.legend_sort_field is None:
            self.legend_sort_field = 'color'
            self.legend_sort_direction = "ascending"

        # find any bin operations applied to get the bin width and height
        for op in self._data.operations:
            if isinstance(op, Bins):
                if op.centers_column == self.x.selection:
                    if 'bin_width' not in self.properties_with_values(include_defaults=False):
                        self.bin_width = op.bin_width
                else:
                    if 'bin_height' not in self.properties_with_values(include_defaults=False):
                        self.bin_height = op.bin_width

    def process_data(self):
        """Perform aggregation and binning as requried."""

        # if we have a stat to apply, aggregate on it, and use resulting column
        if self.stat is not None:
            agg = Aggregate(dimensions=[self.x.selection, self.y.selection],
                            columns=self.values.selection, stat=self.stat)
            self._data._data = agg.apply(self._data._data)
            self.values.selection = agg.agg_column

        # color by the values selection
        self.attributes['color'].setup(data=self._data.source,
                                       columns=self.values.selection)
        self.attributes['color'].add_bin_labels(self._data)

    def yield_renderers(self):
        """Generate a set fo bins for each group of data."""
        for group in self._data.groupby(**self.attributes):

            binned_values = self.values.selection + '_values'
            comp_glyph = BinGlyph(x=group.get_values(self.x.selection),
                                  y=group.get_values(self.y.selection),
                                  values=group.get_values(binned_values),
                                  width=self.bin_width * self.spacing_ratio,
                                  height=self.bin_height * self.spacing_ratio,
                                  line_color=group['color'],
                                  fill_color=group['color'],
                                  label=group.label
                                  )

            self.add_glyph(group, comp_glyph)

            # yield the renderers from the comp glyph
            for renderer in comp_glyph.renderers:
                yield renderer
