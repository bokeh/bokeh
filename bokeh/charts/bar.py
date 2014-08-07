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

import numpy as np
import pandas as pd

from ._charts import Chart
from ._chartobject import ChartObject

from ..objects import ColumnDataSource, FactorRange, Range1d

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
        # self.source, self.xdr, self.ydr, self.groups are inherited attr
        # self.data and self.attr are inheriteed from ChartObject where the
        # the helper method lives...

    def stacked(self, stacked=True):
        self._stacked = stacked
        return self

    def check_attr(self):
        super(Bar, self).check_attr()

        if not hasattr(self, '_stacked'):
            self._stacked = self.__stacked

    def get_data(self, cat, **value):
        "Take the bar data from the input and calculate the parameters accordingly."
        self.cat = cat
        self.width = [0.8] * len(self.cat)
        self.width_cat = [0.2] * len(self.cat)
        self.zero = np.zeros(len(self.cat))
        self.data = dict(cat=self.cat, width=self.width, width_cat=self.width_cat, zero=self.zero)

        # assuming value is a dict, ordered dict
        self.value = value

        # list to save all the attributes we are going to create
        self.attr = []

        # list to save all the groups available in the incomming input
        # Grouping
        step = np.linspace(0, 1.0, len(self.value.keys()) + 1, endpoint=False)

        self.groups.extend(self.value.keys())

        for i, val in enumerate(self.value.keys()):
            self._set_and_get("", val, self.value[val])
            self._set_and_get("mid", val, self.value[val] / 2)
            self._set_and_get("stacked", val, self.zero + self.value[val] / 2)
            # Grouped
            self._set_and_get("cat", val, [c + ":" + str(step[i + 1]) for c in self.cat])
            # Stacked
            self.zero += self.value[val]

    def get_source(self, stacked):
        "Get the bar data into the ColumnDataSource and calculate the proper ranges."
        self.source = ColumnDataSource(self.data)
        self.xdr = FactorRange(factors=self.source.data["cat"])
        if stacked:
            self.ydr = Range1d(start=0, end=1.1 * max(self.zero))
        else:
            cat = [i for i in self.attr if not i.startswith(("mid", "stacked", "cat"))]
            end = 1.1 * max(max(self.data[i]) for i in cat)
            self.ydr = Range1d(start=0, end=end)

    def draw(self, stacked):
        "Use the `rect` renderer to display the bars."
        self.quartet = list(self._chunker(self.attr, 4))
        colors = self._set_colors(self.quartet)

        # quartet elements are: [data, mid, stacked, cat]
        for i, quartet in enumerate(self.quartet):
            if stacked:
                self.chart.make_rect("cat", quartet[2], "width", quartet[0], colors[i])
            else:  # Grouped
                self.chart.make_rect(quartet[3], quartet[1], "width_cat", quartet[0], colors[i])

    def show(self):
        "This is the main Bar show function."
        if isinstance(self.value, pd.DataFrame):
            self.cat = self.value.index.values.tolist()
        # we need to check the chained method attr
        self.check_attr()
        # we create the chart object
        self.chart = Chart(self._title, self._xlabel, self._ylabel, self._legend,
                      self.xscale, self.yscale, self._width, self._height,
                      self._tools, self._filename, self._server, self._notebook)
        # we start the plot (adds axis, grids and tools)
        self.chart.start_plot()
        # we get the data from the incoming input
        self.get_data(self.cat, **self.value)
        # we filled the source and ranges with the calculated data
        self.get_source(self._stacked)
        # we dinamically inject the source and ranges into the plot
        self.chart.add_data_plot(self.source, self.xdr, self.ydr)
        # we add the glyphs into the plot
        self.draw(self._stacked)
        # finally we pass info to build the legend
        self.chart.end_plot(self.groups)
        self.chart.show()
