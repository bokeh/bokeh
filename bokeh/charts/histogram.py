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

from ._charts import Chart
from ._chartobject import ChartObject

from ..objects import ColumnDataSource, Range1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Histogram(ChartObject):

    def __init__(self, measured, bins, mu=None, sigma=None,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False):
        self.measured = measured
        self.bins = bins
        self.mu = mu
        self.sigma = sigma
        super(Histogram, self).__init__(title, xlabel, ylabel, legend,
                                        xscale, yscale, width, height,
                                        tools, filename, server, notebook)
        # self.source, self.xdr, self.ydr, self.groups are inherited attr
        # self.data and self.attr are inheriteed from ChartObject where the
        # the helper method lives...

    def check_attr(self):
        super(Histogram, self).check_attr()

    def get_data_histogram(self, bins, mu, sigma, **value):
        "Take the histogram data from the input and calculate the parameters accordingly."

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

    def get_source_histogram(self):
        "Get the histogram data into the ColumnDataSource and calculate the proper ranges."
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

    def histogram(self):
        "Use the `quad` renderer to display the histogram bars."
        if not self.mu_and_sigma:
            self.quintet = list(self._chunker(self.attr, 6))
            colors = self._set_colors(self.quintet)

            for i, quintet in enumerate(self.quintet):
                self.chart.make_quad(quintet[1], quintet[5], quintet[3], quintet[4], colors[i])
        else:
            self.octet = list(self._chunker(self.attr, 9))
            colors = self._set_colors(self.octet)

            for i, octet in enumerate(self.octet):
                self.chart.make_quad(octet[1], octet[5], octet[3], octet[4], colors[i])
                self.chart.make_line(octet[6], octet[7], "black")
                self.chart.make_line(octet[6], octet[8], "blue")

    def show(self):
        "This is the main Histogram show function."
        # we need to check the chained method attr
        self.check_attr()
        # we create the chart object
        self.chart = Chart(self._title, self._xlabel, self._ylabel, self._legend,
                      self.xscale, self.yscale, self._width, self._height,
                      self._tools, self._filename, self._server, self._notebook)
        # we start the plot (adds axis, grids and tools)
        self.chart.start_plot()
        # we get the data from the incoming input
        self.get_data_histogram(self.bins, self.mu, self.sigma, **self.measured)
        # we filled the source and ranges with the calculated data
        self.get_source_histogram()
        # we dinamically inject the source and ranges into the plot
        self.chart.add_data_plot(self.source, self.xdr, self.ydr)
        # we add the glyphs into the plot
        self.histogram()
        # finally we pass info to build the legend
        self.chart.end_plot(self.groups)
        self.chart.show()
