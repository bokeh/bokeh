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

from ._charts import Chart
from ._chartobject import ChartObject

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Histogram(ChartObject):

    def __init__(self, measured, bins, mu=None, sigma=None,
                 title=None, xname=None, yname=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 filename=False, server=False, notebook=False):
        self.measured = measured
        self.bins = bins
        self.mu = mu
        self.sigma = sigma
        super(Histogram, self).__init__(title, xname, yname, legend,
                                        xscale, yscale, width, height,
                                        filename, server, notebook)

    def check_attr(self):
        super(Histogram, self).check_attr()

    def draw(self):
        self.check_attr()

        chart = Chart(self._title, self._xname, self._yname, self._legend,
                      self.xscale, self.yscale, self._width, self._height,
                      self._filename, self._server, self._notebook)
        chart.get_data_histogram(self.bins, self.mu, self.sigma, **self.measured)
        chart.get_source_histogram()
        chart.start_plot()
        chart.histogram()
        chart.end_plot()
        chart.draw()
