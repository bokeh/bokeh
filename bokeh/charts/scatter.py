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

    def check_attr(self):
        super(Scatter, self).check_attr()

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

        chart = Chart(self._title, self._xlabel, self._ylabel, self._legend,
                      self.xscale, self.yscale, self._width, self._height,
                      self._tools, self._filename, self._server, self._notebook)
        chart.get_data_scatter(**self.pairs)
        chart.get_source_scatter()
        chart.start_plot()
        chart.scatter()
        chart.end_plot()
        chart.show()
