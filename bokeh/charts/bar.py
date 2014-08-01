"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Bar class which lets you build your bar plots just passing
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


class Bar(ChartObject):

    def __init__(self, value, cat=None, stacked=False,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="categorical", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False):
        self.cat = cat
        self.value = value
        self.__stacked = stacked
        super(Bar, self).__init__(title, xlabel, ylabel, legend,
                                  xscale, yscale, width, height,
                                  tools, filename, server, notebook)

    def stacked(self, stacked=True):
        self._stacked = stacked
        return self

    def check_attr(self):
        super(Bar, self).check_attr()

        if not hasattr(self, '_stacked'):
            self._stacked = self.__stacked

    def show(self):
        "This is the main Bar show function."
        if isinstance(self.value, pd.DataFrame):
            self.cat = self.value.index.values.tolist()

        self.check_attr()

        chart = Chart(self._title, self._xlabel, self._ylabel, self._legend,
                      self.xscale, self.yscale, self._width, self._height,
                      self._tools, self._filename, self._server, self._notebook)
        chart.get_data_bar(self.cat, **self.value)
        chart.get_source_bar(self._stacked)
        chart.start_plot()
        chart.bar(self._stacked)
        chart.end_plot()
        chart.show()
