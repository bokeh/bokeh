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
# The full license is in the file LICENCE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import numpy as np
import pandas as pd

from ._chartobject import ChartObject

from ..objects import ColumnDataSource, FactorRange, Range1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class BoxPlot(ChartObject):
    """This is the BoxPlot class and it is in charge of plotting
    scatter plots in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (rects, lines and markers)
    taking the references from the source.

    Examples:

        from collections import OrderedDict

        import numpy as np

        from bokeh.charts import BoxPlot
        from bokeh.sampledata.olympics2014 import data

        data = {d['abbr']: d['medals'] for d in data['data'] if d['medals']['total'] > 0}

        countries = sorted(data.keys(), key=lambda x: data[x]['total'], reverse=True)

        gold = np.array([data[abbr]['gold'] for abbr in countries], dtype=np.float)
        silver = np.array([data[abbr]['silver'] for abbr in countries], dtype=np.float)
        bronze = np.array([data[abbr]['bronze'] for abbr in countries], dtype=np.float)

        medals = OrderedDict(bronze=bronze, silver=silver, gold=gold)

        boxplot = BoxPlot(medals, marker="circle", outliers=True,
                          title="boxplot, dict_input", xlabel="medal type", ylabel="medal count",
                          width=800, height=600, notebook=True)
        boxplot.show()
    """
    def __init__(self, value, marker="circle", outliers=True,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False):
        """ Initialize a new boxplot.
        Args:
            value (DataFrame/OrderedDict/dict): containing the data with names as a key
                and the data as a value.
            marker (int/string, optional): if outliers=True, the marker type to use
                e.g., `circle`.
            outliers (bool, optional): Whether or not to plot outliers.
            title (str, optional): the title of your plot. Defaults to None.
            xlabel (str, optional): the x-axis label of your plot.
                Defaults to None.
            ylabel (str, optional): the y-axis label of your plot.
                Defaults to None.
            legend (str, optional): the legend of your plot. The legend content is
                inferred from incoming input.It can be `top_left`,
                `top_right`, `bottom_left`, `bottom_right`.
                It is `top_right` is you set it as True.
                Defaults to None.
            xscale (str, optional): the x-axis type scale of your plot. It can be
                `linear`, `date` or `categorical`.
                Defaults to `linear`.
            yscale (str, optional): the y-axis type scale of your plot. It can be
                `linear`, `date` or `categorical`.
                Defaults to `linear`.
            width (int, optional): the width of your plot in pixels.
                Defaults to 800.
            height (int, optional): the height of you plot in pixels.
                Defaults to 600.
            tools (bool, optional): to enable or disable the tools in your plot.
                Defaults to True
            filename (str, bool, optional): the name of the file where your plot.
                will be written. If you pass True to this argument, it will use
                "untitled" as a filename.
                Defaults to False.
            server (str, bool, optional): the name of your plot in the server.
                If you pass True to this argument, it will use "untitled"
                as the name in the server.
                Defaults to False.
            notebook (bool, optional):if you want to output (or not) your plot into the
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
        self.__marker = marker
        self.__outliers = outliers
        self.source = None
        self.xdr = None
        self.ydr = None
        self.groups = []
        self.data = dict()
        self.attr = []
        super(BoxPlot, self).__init__(title, xlabel, ylabel, legend,
                                  xscale, yscale, width, height,
                                  tools, filename, server, notebook)

    def marker(self, marker="circle"):
        self._marker = marker
        return self

    def outliers(self, outliers=True):
        self._outliers = outliers
        return self

    def check_attr(self):
        """This method checks if any of the chained method were used. If they were
        not used, it assign the init params content by default.
        """
        super(BoxPlot, self).check_attr()

        if not hasattr(self, '_marker'):
            self._marker = self.__marker

        if not hasattr(self, '_outliers'):
            self._outliers = self.__outliers

    def get_data(self, cat, marker, outliers, **value):
        """Take the data from the input **value and calculate the
        parameters accordingly. Then build a dict containing references
        to all the calculated point to be used by the quad glyph inside the
        `draw` method.
        """
        self.cat = cat
        self.marker = marker
        self.outliers = outliers
        self.width = [0.8] * len(self.cat)
        self.data = dict(cat=self.cat, width=self.width)

        # assuming value is a dict for now
        self.value = value

        # list to save all the attributes we are going to create
        self.attr = []

        self.groups.extend(self.value.keys())

        self.nones = [None] * len(self.cat)

        for i, level in enumerate(self.value.keys()):

            # Initialize all the list to be used to store data
            (q0_list, q2_list, u_cp_list, u_he_list,
            l_cp_list, l_he_list, iqr_cp_list, iqr_list,
            lower_list, upper_list) = (list(self.nones) for i in range(10))

            # Compute quantiles, center points, heights, IQR, etc.
            # quantiles
            q = np.percentile(self.value[level], [25, 50, 75])
            q0_list[i] = q[0]
            q2_list[i] = q[2]

            # rect center points and heights
            u_cp_list[i] = (q[2] + q[1]) / 2
            u_he_list[i] = q[2] - q[1]
            l_cp_list[i] = (q[1] + q[0]) / 2
            l_he_list[i] = q[1] - q[0]

            # IQR related stuff...
            iqr_cp_list[i] = (q[2] + q[0]) / 2
            iqr = q[2] - q[0]
            iqr_list[i] = iqr

            lower = q[1] - 1.5 * iqr
            lower_list[i] = lower

            upper = q[1] + 1.5 * iqr
            upper_list[i] = upper

            # Store indices of outliers as list
            outliers = np.where((self.value[level] > upper) | (self.value[level] < lower))[0]
            out = self.value[level][outliers]
            out_x, out_y = ([], [])
            for o in out:
                out_x.append(level)
                out_y.append(o)

            # Store
            self._set_and_get("q0", level, q0_list)
            self._set_and_get("lower_list", level, lower_list)
            self._set_and_get("q2", level, q2_list)
            self._set_and_get("upper_list", level, upper_list)
            self._set_and_get("iqr_cp_list", level, iqr_cp_list)
            self._set_and_get("iqr_list", level, iqr_list)
            self._set_and_get("u_cp_list", level, u_cp_list)
            self._set_and_get("u_he_list", level, u_he_list)
            self._set_and_get("l_cp_list", level, l_cp_list)
            self._set_and_get("l_he_list", level, l_he_list)
            self._set_and_get("out_x", level, out_x)
            self._set_and_get("out_y", level, out_y)

    def get_source(self):
        """Get the boxplot data dict into the ColumnDataSource and
        calculate the proper ranges."""
        self.source = ColumnDataSource(self.data)
        self.xdr = FactorRange(factors=self.source.data["cat"])
        lowers, uppers = self.attr[1::12], self.attr[3::12]

        def drop_none(l):
            return [i for i in l if i is not None]

        start_y = min(min(drop_none(self.data[i])) for i in lowers)
        end_y = max(max(drop_none(self.data[i])) for i in uppers)

        ## Expand min/max to encompass outliers
        if self.outliers:
            outs = self.attr[11::12]
            start_out_y = min(min(self.data[x]) for x in outs if len(self.data[x]) > 0)
            end_out_y = max(max(self.data[x]) for x in outs if len(self.data[x]) > 0)
            start_y = min(start_y, start_out_y)
            end_y = max(end_y, end_out_y)
        self.ydr = Range1d(start=start_y - 0.1 * (end_y-start_y), end=end_y + 0.1 * (end_y-start_y))

    def draw(self):
        """Use a selected marker glyph to display the points, segments to
        display the iqr and rects to display the boxes, taking as reference
        points the data loaded at the ColumnDataSurce.
        """
        self.quartet = list(self._chunker(self.attr, 12))
        colors = self._set_colors(self.quartet)

        for i, quartet in enumerate(self.quartet):
            self.chart.make_segment("cat", quartet[1], "cat", quartet[0], "black", 2)
            self.chart.make_segment("cat", quartet[2], "cat", quartet[3], "black", 2)
            self.chart.make_rect("cat", quartet[4], "width", quartet[5], None, "black", 2)
            self.chart.make_rect("cat", quartet[6], "width", quartet[7], colors[i], "black", None)
            self.chart.make_rect("cat", quartet[8], "width", quartet[9], colors[i], "black", None)
            if self.outliers:
                self.chart.make_scatter(quartet[10], quartet[11], self.marker, colors[i])

        # We need to manually select the proper glyphsto be rendered as legends
        if self.outliers:
            indexes = [3, 9, 15]  # 1st rect, 2nd rect, 3rd rect
        else:
            indexes = [3, 8, 13]  # 1st rect, 2nd rect, 3rd rect
        self.chart.glyphs = [self.chart.glyphs[i] for i in indexes]

    def show(self):
        """This is the main boxPlot show function.
        It essentially checks for chained methods, creates the chart,
        pass data into the plot object, draws the glyphs according
        to the data and shows the chart in the selected output.

        Note: the show method can not be chained. It has to be called
        at the end of the chain.
        """
        if isinstance(self.value, pd.DataFrame):
            self.cat = self.value.columns
        else:
            self.cat = self.value.keys()

        # we need to check the chained method attr
        self.check_attr()
        # we create the chart object
        self.create_chart()
        # we start the plot (adds axis, grids and tools)
        self.start_plot()
        # we get the data from the incoming input
        self.get_data(self.cat, self._marker, self._outliers, **self.value)
        # we filled the source and ranges with the calculated data
        self.get_source()
        # we dinamically inject the source and ranges into the plot
        self.add_data_plot(self.source, self.xdr, self.ydr)
        # we add the glyphs into the plot
        self.draw()
        # we pass info to build the legend
        self.end_plot(self.groups)
        # and finally we show it
        self.show_chart()

    # Some helper methods
    def _set_and_get(self, prefix, val, content):
        """Set a new attr and then get it to fill the self.data dict.
        Keep track of the attributes created.

        Args:
            prefix (str): prefix of the new attribute
            val (string): name of the new attribute
            content (obj): content of the new attribute
        """
        setattr(self, prefix + val, content)
        self.data[prefix + val] = getattr(self, prefix + val)
        self.attr.append(prefix + val)
