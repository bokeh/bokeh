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

import pandas as pd

from ._charts import Chart
from ._chartobject import ChartObject

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class BoxPlot(ChartObject):

    def __init__(self, value, title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False, outliers=True,
                 marker="circle", line_width=2):
        """ Initialize a new boxplot.
        Args:
            value (DataFrame/OrderedDict/dict): the data to plot
            outliers (bool): Whether or not to plot outliers
            marker (int/string): if outliers=True, the marker type to use (e.g., 'circle')
            line_width: width of the inter-quantile range line
        """
        self.value = value
        self.marker = marker
        self.outliers = outliers
        super(BoxPlot, self).__init__(title, xlabel, ylabel, legend,
                                  xscale, yscale, width, height,
                                  tools, filename, server, notebook)

    def check_attr(self):
        super(BoxPlot, self).check_attr()

    def show(self):
        "This is the main BoxPlot show function."
        if isinstance(self.value, pd.DataFrame):
            self.cat = self.value.columns
        else:
            self.cat = self.value.keys()

        self.check_attr()

        chart = Chart(self._title, self._xlabel, self._ylabel, self._legend,
                      self.xscale, self.yscale, self._width, self._height,
                      self._tools, self._filename, self._server, self._notebook)
        chart.get_data_boxplot(self.cat, self.marker, self.outliers, **self.value)
        chart.get_source_boxplot()
        chart.start_plot()
        chart.boxplot()
        chart.end_plot()
        chart.show()
