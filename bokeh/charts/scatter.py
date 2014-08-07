"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Scatter class which lets you build your scatter plots just passing
the arguments to the Chart class and calling the proper functions.
It also add detection of the incomming input to see if it is a pandas dataframe
or a pandas groupby object.
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

from ..objects import ColumnDataSource, Range1d

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


class Scatter(ChartObject):

    def __init__(self, pairs,
                 title=None, xlabel=None, ylabel=None, legend=False,
                 xscale="linear", yscale="linear", width=800, height=600,
                 tools=True, filename=False, server=False, notebook=False):
        self.pairs = pairs
        super(Scatter, self).__init__(title, xlabel, ylabel, legend,
                                      xscale, yscale, width, height,
                                      tools, filename, server, notebook)
        # self.source, self.xdr, self.ydr, self.groups are inherited attr
        # self.data and self.attr are inheriteed from ChartObject where the
        # the helper method lives...

    def check_attr(self):
        super(Scatter, self).check_attr()

    def get_data(self, **pairs):
        "Take the scatter data from the input and calculate the parameters accordingly."
        self.data = dict()

        # assuming value is an ordered dict
        self.pairs = pairs

        # list to save all the attributes we are going to create
        self.attr = []

        # list to save all the groups available in the incomming input
        self.groups.extend(self.pairs.keys())

        # Grouping
        for i, val in enumerate(self.pairs.keys()):
            xy = self.pairs[val]
            self._set_and_get("x_", val, xy[:, 0])
            self._set_and_get("y_", val, xy[:, 1])

    def get_source(self):
        "Get the scatter data into the ColumnDataSource and calculate the proper ranges."
        self.source = ColumnDataSource(self.data)

        x_names, y_names = self.attr[::2], self.attr[1::2]

        endx = max(max(self.data[i]) for i in x_names)
        startx = min(min(self.data[i]) for i in x_names)
        self.xdr = Range1d(start=startx - 0.1 * (endx - startx), end=endx + 0.1 * (endx - startx))

        endy = max(max(self.data[i]) for i in y_names)
        starty = min(min(self.data[i]) for i in y_names)
        self.ydr = Range1d(start=starty - 0.1 * (endy - starty), end=endy + 0.1 * (endy - starty))

    def draw(self):
        "Use different marker renderers to display the incomming groups."
        self.duplet = list(self._chunker(self.attr, 2))
        colors = self._set_colors(self.duplet)

        for i, duplet in enumerate(self.duplet, start=1):
            self.chart.make_scatter(duplet[0], duplet[1], i, colors[i - 1])

    def show(self):
        "This is the main Scatter show function."
        # asumming we get an hierchiral pandas object
        if isinstance(self.pairs, pd.DataFrame):
            self.labels = self.pairs.columns.levels[1].values

            from collections import OrderedDict
            pdict = OrderedDict()

            for i in self.pairs.columns.levels[0].values:
                pdict[i] = self.pairs[i].dropna().values

            self.pairs = pdict

        # asumming we get an groupby object
        if isinstance(self.pairs, pd.core.groupby.DataFrameGroupBy):
            from collections import OrderedDict
            pdict = OrderedDict()

            for i in self.pairs.groups.keys():
                self.labels = self.pairs.get_group(i).columns
                xname = self.pairs.get_group(i).columns[0]
                yname = self.pairs.get_group(i).columns[1]
                x = getattr(self.pairs.get_group(i), xname)
                y = getattr(self.pairs.get_group(i), yname)
                pdict[i] = np.array([x.values, y.values]).T

            self.pairs = pdict

        self.check_attr()

        if self._xlabel is None:
            self._xlabel = self.labels[0]
        if self._ylabel is None:
            self._ylabel = self.labels[1]

        # we create the chart object
        self.chart = Chart(self._title, self._xlabel, self._ylabel, self._legend,
                      self.xscale, self.yscale, self._width, self._height,
                      self._tools, self._filename, self._server, self._notebook)
        # we start the plot (adds axis, grids and tools
        self.chart.start_plot()
        # we get the data from the incoming input
        self.get_data(**self.pairs)
        # we filled the source and ranges with the calculated data
        self.get_source()
        # we dinamically inject the source and ranges into the plot
        self.chart.add_data_plot(self.source, self.xdr, self.ydr)
        # we add the glyphs into the plot
        self.draw()
        # finally we pass info to build the legend
        self.chart.end_plot(self.groups)
        self.chart.show()
