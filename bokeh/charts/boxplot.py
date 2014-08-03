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

    def __init__(self, value, marker="circle", outliers=True,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False):
        """ Initialize a new boxplot.
        Args:
            value (DataFrame/OrderedDict/dict): the data to plot
            outliers (bool): Whether or not to plot outliers
            marker (int/string): if outliers=True, the marker type to use (e.g., 'circle')
        """
        self.value = value
        self.__marker = marker
        self.__outliers = outliers
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
        super(BoxPlot, self).check_attr()

        if not hasattr(self, '_marker'):
            self._marker = self.__marker

        if not hasattr(self, '_outliers'):
            self._outliers = self.__outliers

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
        chart.get_data_boxplot(self.cat, self._marker, self._outliers, **self.value)
        chart.get_source_boxplot()
        chart.start_plot()
        chart.boxplot()
        chart.end_plot()
        chart.show()
