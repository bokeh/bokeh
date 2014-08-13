"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Histogram class which lets you build your histograms just passing
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
import scipy.special
import numpy as np

from ._chartobject import ChartObject

from ..objects import ColumnDataSource, Range1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Histogram(ChartObject):
    """This is the Histogram class and it is in charge of plotting
    histograms in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (quads and lines) taking the
    references from the source.

    Examples:

        from collections import OrderedDict

        import numpy as np
        from bokeh.charts import Histogram

        mu, sigma = 0, 0.5
        normal = np.random.normal(mu, sigma, 1000)
        lognormal = np.random.lognormal(mu, sigma, 1000)

        distributions = OrderedDict(normal=normal, lognormal=lognormal)

        hist = Histogram(distributions, bins=50, notebook=True)
        hist.title("chained_methods, dict_input").ylabel("frequency")\
.legend(True).width(400).height(350).show()
    """
    def __init__(self, measured, bins, mu=None, sigma=None,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False):
        """
        Args:
            measured (dict): a dict containing the data with name as a key
                and the data as a value.
            bins (int): number of bins to use in the histogram building.
            mu (float, optional): theoretical mean value for the normal
                distribution. Defaults to None.
            sigma (float, optional): theoretical sigma value for the normal
                distribution. Defaults to None.
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
        """
        self.measured = measured
        self.bins = bins
        self.mu = mu
        self.sigma = sigma
        super(Histogram, self).__init__(title, xlabel, ylabel, legend,
                                        xscale, yscale, width, height,
                                        tools, filename, server, notebook)
        # self.source, self.xdr, self.ydr, self.groups are inherited attrs
        # self.data and self.attr are inheriteed from ChartObject where the
        # the helper method lives...

    def check_attr(self):
        """This method checks if any of the chained method were used. If they were
        not used, it assign the init params content by default.
        """
        super(Histogram, self).check_attr()

    def get_data(self, bins, mu, sigma, **value):
        """Take the histogram data from the input **value and calculate
        the parameters accordingly. Then build a dict containing references
        to all the calculated point to be used by the quad glyph inside the
        `draw` method.
        """
        # assuming value is a dict, ordered dict
        self.value = value

        # list to save all the groups available in the incomming input
        self.groups.extend(self.value.keys())

        # fill the data dictionary with the proper values
        for i, val in enumerate(self.value.keys()):
            self._set_and_get("", val, self.value[val])
            hist, edges = np.histogram(self.data[val], density=True, bins=bins)
            self._set_and_get("hist", val, hist)
            self._set_and_get("edges", val, edges)
            self._set_and_get("left", val, edges[:-1])
            self._set_and_get("right", val, edges[1:])
            self._set_and_get("bottom", val, np.zeros(len(hist)))

            self.mu_and_sigma = False

            if mu is not None and sigma is not None:
                self.mu_and_sigma = True
                self._set_and_get("x", val, np.linspace(-2, 2, len(self.data[val])))
                pdf = 1 / (sigma * np.sqrt(2 * np.pi)) * np.exp(-(self.data["x" + val] - mu) ** 2 / (2 * sigma ** 2))
                self._set_and_get("pdf", val, pdf)
                self.groups.append("pdf")
                cdf = (1 + scipy.special.erf((self.data["x" + val] - mu) / np.sqrt(2 * sigma ** 2))) / 2
                self._set_and_get("cdf", val, cdf)
                self.groups.append("cdf")

    def get_source(self):
        """Get the histogram data dict into the ColumnDataSource
        and calculate the proper ranges."""
        self.source = ColumnDataSource(data=self.data)

        if not self.mu_and_sigma:
            x_names, y_names = self.attr[2::6], self.attr[1::6]
        else:
            x_names, y_names = self.attr[2::9], self.attr[1::9]

        endx = max(max(self.data[i]) for i in x_names)
        startx = min(min(self.data[i]) for i in x_names)
        self.xdr = Range1d(start=startx - 0.1 * (endx - startx),
                           end=endx + 0.1 * (endx - startx))

        endy = max(max(self.data[i]) for i in y_names)
        if endy < 1.0:
            endy = 1.0
        self.ydr = Range1d(start=0, end=1.1 * endy)

    def draw(self):
        """Use the quad (and line) glyphs to display the histogram
        bars, taking as reference points the data loaded at the
        ColumnDataSurce.
        """
        if not self.mu_and_sigma:
            self.quintet = list(self._chunker(self.attr, 6))
            colors = self._set_colors(self.quintet)

            for i, quintet in enumerate(self.quintet):
                self.chart.make_quad(quintet[1], quintet[5], quintet[3], quintet[4], colors[i], "white")
        else:
            self.octet = list(self._chunker(self.attr, 9))
            colors = self._set_colors(self.octet)

            for i, octet in enumerate(self.octet):
                self.chart.make_quad(octet[1], octet[5], octet[3], octet[4], colors[i], "white")
                self.chart.make_line(octet[6], octet[7], "black")
                self.chart.make_line(octet[6], octet[8], "blue")

    def show(self):
        """This is the main Histogram show function.
        It essentially checks for chained methods, creates the chart,
        pass data into the plot object, draws the glyphs according
        to the data and shows the chart in the selected output.

        Note: the show method can not be chained. It has to be called
        at the end of the chain.
        """
        # we need to check the chained method attr
        self.check_attr()
        # we create the chart object
        self.create_chart()
        # we start the plot (adds axis, grids and tools)
        self.start_plot()
        # we get the data from the incoming input
        self.get_data(self.bins, self.mu, self.sigma, **self.measured)
        # we filled the source and ranges with the calculated data
        self.get_source()
        # we dinamically inject the source and ranges into the plot
        self.add_data_plot()
        # we add the glyphs into the plot
        self.draw()
        # we pass info to build the legend
        self.end_plot()
        # and finally we show it
        self.show_chart()
