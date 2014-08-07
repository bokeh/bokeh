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

from ._charts import Chart
from ._chartobject import ChartObject

from ..objects import ColumnDataSource, FactorRange, Range1d

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
        # self.source, self.xdr, self.ydr, self.groups are inherited attr
        # self.data and self.attr are inheriteed from ChartObject where the
        # the helper method lives...

    def check_attr(self):
        super(BoxPlot, self).check_attr()

    def get_data_boxplot(self, cat, marker, outliers, **value):
        "Take the boxplot data from the input and calculate the parameters accordingly."
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

    def get_source_boxplot(self):
        "Get the boxplot data into the ColumnDataSource and calculate the proper ranges."
        self.source = ColumnDataSource(self.data)
        self.xdr = FactorRange(factors=self.source.data["cat"])
        y_names = self.attr[::6]
        start_y = min(min(self.data[i]) for i in y_names)
        end_y = max(max(self.data[i]) for i in y_names)
        # Expand min/max to encompass IQR line
        start_y = min(end_y, min(self.data[x][0] for x in self.attr[4::6]))
        end_y = max(end_y, max(self.data[x][1] for x in self.attr[4::6]))
        self.ydr = Range1d(start=start_y - 0.1 * (end_y-start_y), end=end_y + 0.1 * (end_y-start_y))

    def boxplot(self):
        " Use the `rect`, `scatter`, and `segment` renderers to display the boxplot. "
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
        "This is the main BoxPlot show function."
        if isinstance(self.value, pd.DataFrame):
            self.cat = self.value.columns
        else:
            self.cat = self.value.keys()

        self.check_attr()

        # we create the chart object
        self.chart = Chart(self._title, self._xlabel, self._ylabel, self._legend,
                      self.xscale, self.yscale, self._width, self._height,
                      self._tools, self._filename, self._server, self._notebook)
        # we start the plot (adds axis, grids and tools)
        self.chart.start_plot()
        # we get the data from the incoming input
        self.get_data_boxplot(self.cat, self.marker, self.outliers, **self.value)
        # we filled the source and ranges with the calculated data
        self.get_source_boxplot()
        # we dinamically inject the source and ranges into the plot
        self.chart.add_data_plot(self.source, self.xdr, self.ydr)
        # we add the glyphs into the plot
        self.boxplot()
        # finally we pass info to build the legend
        self.chart.end_plot(self.groups)
        self.chart.show()
