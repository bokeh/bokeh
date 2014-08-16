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
    def __init__(self, value, title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False, outliers=True,
                 marker="circle", line_width=2):
        """ Initialize a new BoxPlot.
        Args:
            value (DataFrame or OrderedDict/dict): containing the data with names as a key
                and the data as a value.
            outliers (bool, optional): Whether or not to plot outliers.
            marker (int or string, optional): if outliers=True, the marker type to use
                e.g., `circle`.
            line_width (int): width of the inter-quantile range line.
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
            filename (str or bool, optional): the name of the file where your plot.
                will be written. If you pass True to this argument, it will use
                "untitled" as a filename.
                Defaults to False.
            server (str or bool, optional): the name of your plot in the server.
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
        self.marker = marker
        self.outliers = outliers
        self.source = None
        self.xdr = None
        self.ydr = None
        self.groups = []
        self.data = dict()
        self.attr = []
        super(BoxPlot, self).__init__(title, xlabel, ylabel, legend,
                                  xscale, yscale, width, height,
                                  tools, filename, server, notebook)

    def check_attr(self):
        """Check if any of the chained method were used.

        If they were not used, it assign the init parameters content by default.
        """
        super(BoxPlot, self).check_attr()

    def get_data(self, cat, marker, outliers, **value):
        """Take the BoxPlot data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the quad, segments and markers glyphs inside the `draw` method.

        Args:
            cat (list): categories as a list of strings.
            marker (int or string, optional): if outliers=True, the marker type to use
                e.g., `circle`.
            outliers (bool, optional): Whether or not to plot outliers.
            values (dict or pd obj): the values to be plotted as bars.
        """
        self.cat = cat
        self.marker = marker
        self.outliers = outliers
        self.width = [0.8] * len(self.cat)
        self.width_cat = [0.2] * len(self.cat)
        self.zero = np.zeros(len(self.cat))
        self.data = dict(cat=self.cat, width=self.width, width_cat=self.width_cat, zero=self.zero)

        # assuming value is a dict for now
        self.value = value

        # list to save all the attributes we are going to create
        self.attr = []

        n_levels = len(self.value.keys())
        step = np.linspace(1, n_levels+1, n_levels, endpoint=False)

        self.groups.extend(self.value.keys())

        for i, level in enumerate(self.value.keys()):

            # Compute quantiles, IQR, etc.
            level_vals = self.value[level]
            q = np.percentile(level_vals, [25, 50, 75])
            iqr = q[2] - q[0]
            # Store indices of outliers as list
            lower, upper = q[1] - 1.5*iqr, q[1] + 1.5*iqr
            outliers = np.where((level_vals > upper) | (level_vals < lower))[0]

            # Store
            self._set_and_get("", level, level_vals)
            self._set_and_get("quantiles", level, q)
            self._set_and_get("outliers", level, outliers)
            self._set_and_get("cat", level, [level + ':' + str(step[i])])
            self._set_and_get("line_y", level, [lower, upper])
            self._set_and_get("x", level, step[i])

    def get_source(self):
        "Push the BoxPlot data into the ColumnDataSource and calculate the proper ranges."
        self.source = ColumnDataSource(self.data)
        self.xdr = FactorRange(factors=self.source.data["cat"])
        y_names = self.attr[::6]
        start_y = min(min(self.data[i]) for i in y_names)
        end_y = max(max(self.data[i]) for i in y_names)
        # Expand min/max to encompass IQR line
        start_y = min(end_y, min(self.data[x][0] for x in self.attr[4::6]))
        end_y = max(end_y, max(self.data[x][1] for x in self.attr[4::6]))
        self.ydr = Range1d(start=start_y - 0.1 * (end_y-start_y), end=end_y + 0.1 * (end_y-start_y))

    def draw(self):
        """Use the several glyphs to display the Boxplot.

        It uses the selected marker glyph to display the points, segments to
        display the iqr and rects to display the boxes, taking as reference
        points the data loaded at the ColumnDataSurce.
        """
        self.sextet = list(self._chunker(self.attr, 6))
        colors = self._set_colors(self.sextet)

        # quintet elements are: [data, quantiles, outliers, cat, line_y]
        for i, sextet in enumerate(self.sextet):
            [d, q, outliers, cat, line_y, x] = [self.data[x] for x in sextet]
            self.chart.make_segment(x, line_y[0], x, line_y[1], 'black', 2)
            self.chart.make_quad(q[1], q[0], x-self.width[0]/2., x+self.width[0]/2., colors[i])
            self.chart.make_quad(q[2], q[1], x-self.width[0]/2., x+self.width[0]/2., colors[i])
            if self.outliers and outliers.any():
                for o in d[outliers]:
                    self.chart.make_scatter(x, o, self.marker, colors[i])

    def show(self):
        """Main BoxPlot show method.

        It essentially checks for chained methods, creates the chart,
        pass data into the plot object, draws the glyphs according
        to the data and shows the chart in the selected output.

        .. note:: the show method can not be chained. It has to be called
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
        self.get_data(self.cat, self.marker, self.outliers, **self.value)
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