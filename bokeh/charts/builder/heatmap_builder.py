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

from .._builder import TabularSourceBuilder, create_and_build
from .._data_adapter import DataAdapter
from ...models import FactorRange, GlyphRenderer, HoverTool
from ...models.glyphs import Rect

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def HeatMap(values, xscale="categorical", yscale="categorical",
            xgrid=False, ygrid=False, **kw):
    """ Create a HeatMap chart using :class:`HeatMapBuilder <bokeh.charts.builder.heatmap_builder.HeatMapBuilder>`
    to render the geometry from values.

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
    chart = create_and_build(
        HeatMapBuilder, values, xscale=xscale, yscale=yscale,
        xgrid=xgrid, ygrid=ygrid, **kw
    )
    field = "@" + chart._builders[-1].prefix + "rate"
    chart.add_tools(HoverTool(tooltips=[("value", field)]))
    return chart

class HeatMapBuilder(TabularSourceBuilder):
    """This is the HeatMap class and it is in charge of plotting
    HeatMap chart in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (rects) taking the references
    from the source.

    """

    def _process_data(self):
        """Take the CategoricalHeatMap data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``_yield_renderers`` method.

        """
        # Set up the data for plotting. We will need to have values for every
        # pair of year/month names. Map the rate to a color.
        self._data[self.prefix + 'catx'] = catx = []
        self._data[self.prefix + 'caty'] = caty = []
        self._data[self.prefix + 'color'] = color = []
        self._data[self.prefix + 'rate'] = rate = []
        for y in self.y_names:
            for m in self.x_names:
                catx.append(m)
                caty.append(y)
                rate.append(self._values[m][y])

        # Now that we have the min and max rates
        factor = len(self.palette) - 1
        den = max(rate) - min(rate)
        for y in self.y_names:
            for m in self.x_names:
                c = int(round(factor*(self._values[m][y] - min(rate)) / den))
                color.append(self.palette[c])

        self._data[self.prefix + 'width'] = [0.95] * len(catx)
        self._data[self.prefix + 'height'] = [0.95] * len(catx)

    def _set_ranges(self):
        """Push the CategoricalHeatMap data into the ColumnDataSource
        and calculate the proper ranges.
        """
        self.x_range = FactorRange(factors=self.x_names)
        self.y_range = FactorRange(factors=self.y_names)

    def _yield_renderers(self):
        """Use the rect glyphs to display the categorical heatmap.

        Takes reference points from data loaded at the ColumnDataSurce.
        """
        glyph = Rect(
            x=self.prefix + "catx", y=self.prefix + "caty",
            width=self.prefix + "width", height=self.prefix + "height",
            fill_color=self.prefix + "color", fill_alpha=0.7, line_color="white"
        )
        renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
        # TODO: Legend??
        yield renderer

    def _adapt_values(self):
        """Prepare the input data.

        Converts data input (self._values) to a DataAdapter
        """
        self._values = DataAdapter(self._values, force_alias=True)
        self.x_names = self.x_names or list(self._values.columns)
        self.y_names = self.y_names or list(self._values.index)