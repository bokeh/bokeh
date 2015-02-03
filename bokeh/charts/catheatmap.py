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
# The full license is in the file LICENCE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from __future__ import print_function, division

from ._builder import Builder, create_and_build
from ._data_adapter import DataAdapter
from ..models import ColumnDataSource, FactorRange, GlyphRenderer, HoverTool
from ..models.glyphs import Rect

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def HeatMap(values, xscale="categorical", yscale="categorical",
            xgrid=False, ygrid=False, **kw):
    chart = create_and_build(
        HeatMapBuilder, values, xscale=xscale, yscale=yscale,
        xgrid=xgrid, ygrid=ygrid, **kw
    )
    chart.add_tools(HoverTool(tooltips=[("value", "@rate")]))
    return chart

class HeatMapBuilder(Builder):
    """This is the HeatMap class and it is in charge of plotting
    HeatMap chart in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (rects) taking the references
    from the source.

    Examples:
    from collections import OrderedDict
    from bokeh.charts import HeatMap

    xyvalues = OrderedDict()
    xyvalues['apples'] = [4,5,8]
    xyvalues['bananas'] = [1,2,4]
    xyvalues['pears'] = [6,5,4]
    hm = HeatMap(xyvalues, title="categorical heatmap", filename="cat_heatmap.html")
    hm.width(1000).height(400).show()
    """

    def __init__(self, values, legend=False, palette=None, **kws):
        """
        Args:
            values (iterable 2d): iterable 2d representing the data series matrix.
            palette(list, optional): a list containing the colormap as hex values.
            legend (str, optional): the legend of your plot. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.
                Defaults to None.
            palette(list, optional): a list containing the colormap as
                hex values.

        Attributes:
            source (obj): datasource object for your plot,
                initialized as a dummy None.
            x_range (obj): x-associated datarange object for you plot,
                initialized as a dummy None.
            y_range (obj): y-associated datarange object for you plot,
                initialized as a dummy None.
            groups (list): to be filled with the incoming groups of data.
                Useful for legend construction.
            data (dict): to be filled with the incoming data and be passed
                to the ColumnDataSource in each chart inherited class.
                Needed for _set_And_get method.
            attr (list): to be filled with the new attributes created after
                loading the data dict.
                Needed for _set_And_get method.
        """
        if not palette:
            palette = ["#75968f", "#a5bab7", "#c9d9d3", "#e2e2e2", "#dfccce",
                       "#ddb7b1", "#cc7878", "#933b41", "#550b1d"]
        super(HeatMapBuilder, self).__init__(values, legend, palette=palette)


    def get_data(self):
        """Take the CategoricalHeatMap data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``draw`` method.

        """
        self.catsx = list(self.values.columns)
        self.catsy = list(self.values.index)

        # Set up the data for plotting. We will need to have values for every
        # pair of year/month names. Map the rate to a color.
        catx = []
        caty = []
        color = []
        rate = []
        for y in self.catsy:
            for m in self.catsx:
                catx.append(m)
                caty.append(y)
                rate.append(self.values[m][y])

        # Now that we have the min and max rates
        factor = len(self._palette) - 1
        den = max(rate) - min(rate)
        for y in self.catsy:
            for m in self.catsx:
                c = int(round(factor*(self.values[m][y] - min(rate)) / den))
                color.append(self._palette[c])

        width = [0.95] * len(catx)
        height = [0.95] * len(catx)

        self.data = dict(catx=catx, caty=caty, color=color, rate=rate,
                         width=width, height=height)

    def get_source(self):
        """Push the CategoricalHeatMap data into the ColumnDataSource
        and calculate the proper ranges.
        """
        self.source = ColumnDataSource(self.data)
        self.x_range = FactorRange(factors=self.catsx)
        self.y_range = FactorRange(factors=self.catsy)

    def draw(self):
        """Use the rect glyphs to display the categorical heatmap.

        Takes reference points from data loaded at the ColumnDataSurce.
        """
        glyph = Rect(
            x="catx", y="caty",
            width="width", height="height",
            fill_color="color", fill_alpha=0.7,
            line_color="white"
        )
        renderer =  GlyphRenderer(data_source=self.source, glyph=glyph)
        # TODO: Legend??
        # self._legends.append((self.groups[i], [renderer]))
        yield renderer

    # def _show_teardown(self):
    #     """Add hover tool to HetMap chart"""
    #     self.add_tools(HoverTool(tooltips=[("value", "@rate")]))

    def prepare_values(self):
        """Prepare the input data.

        Converts data input (self.values) to a DataAdapter
        """
        self.values = DataAdapter(self.values, force_alias=True)