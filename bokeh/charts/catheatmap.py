"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the CategoricalHeatMap class which lets you build your
CategoricalHeatMap charts just passing the arguments to the Chart class and
calling the proper functions.
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

import pandas as pd

from ._chartobject import ChartObject

from ..objects import ColumnDataSource, FactorRange, HoverTool

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class CategoricalHeatMap(ChartObject):
    """This is the CategoricalHeatMap class and it is in charge of plotting
    CategoricalHeatMap chart in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (rects) taking the references
    from the source.

    Examples:
        from bokeh.sampledata.unemployment1948 import data

        # pandas magic
        df = data[data.columns[:-2]]
        df2 = df.set_index(df[df.columns[0]].astype(str))
        df2.drop(df.columns[0], axis=1, inplace=True)
        df3 = df2.transpose()

        # bokeh magic
        from bokeh.charts import CategoricalHeatMap
        hm = CategoricalHeatMap(df3, title="categorical heatmap, pd_input", notebook=True)
        hm.width(1000).height(400).show()
    """
    def __init__(self, value, palette=None,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="categorical", yscale="categorical", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False):
        """
        Args:
            value (pd obj): a pandas dataframe containing. Columns and Index must
                be string type.
            palette(list, optional): a list containing the colormap as hex values.
            title (str, optional): the title of your plot. Defaults to None.
            xlabel (str, optional): the x-axis label of your plot.
                Defaults to None.
            ylabel (str, optional): the y-axis label of your plot.
                Defaults to None.
            legend (str, optional): the legend of your plot. The legend content is
                inferred from incoming input.It can be ``top_left``,
                ``top_right``, ``bottom_left``, ``bottom_right``.
                It is ``top_right`` is you set it as True.
                Defaults to None.
            xscale (str, optional): the x-axis type scale of your plot. It can be
                ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``linear``.
            yscale (str, optional): the y-axis type scale of your plot. It can be
                ``linear``, ``datetime`` or ``categorical``.
                Defaults to ``linear``.
            width (int, optional): the width of your plot in pixels.
                Defaults to 800.
            height (int, optional): the height of you plot in pixels.
                Defaults to 600.
            tools (bool, optional): to enable or disable the tools in your plot.
                Defaults to True
            filename (str or bool, optional): the name of the file where your plot.
                will be written. If you pass True to this argument, it will use
                ``untitled`` as a filename.
                Defaults to False.
            server (str or bool, optional): the name of your plot in the server.
                If you pass True to this argument, it will use ``untitled``
                as the name in the server.
                Defaults to False.
            notebook (bool or optional):if you want to output (or not) your plot into the
                IPython notebook.
                Defaults to False.

        Attributes:
            source (obj): datasource object for your plot,
                initialized as a dummy None.
            xdr (obj): x-associated datarange object for you plot,
                initialized as a dummy None.
            ydr (obj): y-associated datarange object for you plot,
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
        self.value = value
        self.palette = palette
        self.source = None
        self.xdr = None
        self.ydr = None
        self.groups = []
        self.data = dict()
        self.attr = []
        super(CategoricalHeatMap, self).__init__(title, xlabel, ylabel, legend,
                                      xscale, yscale, width, height,
                                      tools, filename, server, notebook)

    def check_attr(self):
        """Check if any of the chained method were used.

        If they were not used, it assign the init parameters content by default.
        """
        super(CategoricalHeatMap, self).check_attr()

    def get_data(self, palette, value):
        """Take the CategoricalHeatMap data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``draw`` method.

        Args:
            pallete (list): the colormap as hex values.
            values (pd obj): the pandas dataframe to be plotted as categorical heatmap.
        """
        # assuming value is a pandas df
        self.value = value

        if palette is None:
            colors = ["#75968f", "#a5bab7", "#c9d9d3", "#e2e2e2", "#dfccce",
            "#ddb7b1", "#cc7878", "#933b41", "#550b1d"]
        else:
            colors = palette

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
                rate.append(self.value[m][y])

        # Now that we have the min and max rates
        for y in self.catsy:
            for m in self.catsx:
                c = int(round((len(colors) - 1) * (self.value[m][y] - min(rate)) / (max(rate) - min(rate))))
                color.append(colors[c])

        width = [0.95] * len(catx)
        height = [0.95] * len(catx)

        self.data = dict(catx=catx, caty=caty, color=color, rate=rate,
                         width=width, height=height)

    def get_source(self):
        """Push the CategoricalHeatMap data into the ColumnDataSource
        and calculate the proper ranges.
        """
        self.source = ColumnDataSource(self.data)
        self.xdr = FactorRange(factors=self.catsx)
        self.ydr = FactorRange(factors=self.catsy)

    def draw(self):
        """Use the rect glyphs to display the categorical heatmap.

        Takes reference points from data loaded at the ColumnDataSurce.
        """
        self.chart.make_rect(self.source, "catx", "caty", "width", "height",
                             "color", "white", None)

    def show(self):
        """Main CategoricalHeatMap show method.

        It essentially checks for chained methods, creates the chart,
        pass data into the plot object, draws the glyphs according
        to the data and shows the chart in the selected output.

        .. note:: the show method can not be chained. It has to be called
        at the end of the chain.
        """
        # if we pass a pandas df, the cats are guessed
        #if isinstance(self.value, pd.DataFrame):
        #    self.catsx = self.value.columns.tolist()
        #    self.catsy = self.value.index.tolist()
        #else:
        try:
            self.catsx = self.value.columns
            self.catsy = self.value.index
        except:
            raise
            print("CategoricalHeatMap only support pandas dataframes loading for now.")

        # we need to check the chained method attr
        self.check_attr()
        # we create the chart object
        self.create_chart()
        # we start the plot (adds axis, grids and tools)
        self.start_plot(xgrid=False, ygrid=False)
        # we add the HoverTool
        self.chart.plot.add_tools(HoverTool(tooltips=dict(value="@rate")))
        # we get the data from the incoming input
        self.get_data(self.palette, self.value)
        # we filled the source and ranges with the calculated data
        self.get_source()
        # we dynamically inject the source and ranges into the plot
        self.add_data_plot(self.xdr, self.ydr)
        # we add the glyphs into the plot
        self.draw()
        # we pass info to build the legend
        self.end_plot(self.groups)
        # and finally we show it
        self.show_chart()
