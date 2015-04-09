"""This is the Bokeh charts interface. It gives you a high level API
to build complex plot is a simple way.

This is the Scatter class which lets you build your Scatter charts
just passing the arguments to the Chart class and calling the proper
functions.
"""
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
from __future__ import absolute_import

import numpy as np
try:
    import pandas as pd
except:
    pd = None

from collections import OrderedDict

from ..utils import make_scatter, _marker_types
from .._builder import create_and_build, Builder, TabularSourceBuilder
from .._data_adapter import DataAdapter
from ...models import ColumnDataSource
from ...properties import Enum

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Scatter(values, **kws):
    """ Create a scatter chart using :class:`ScatterBuilder <bokeh.charts.builder.scatter_builder.ScatterBuilder>`
    to render the geometry from values.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.

    In addition the the parameters specific to this chart,
    :ref:`charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        from collections import OrderedDict
        from bokeh.charts import Scatter, output_file, show

        # (dict, OrderedDict, lists, arrays and DataFrames of (x, y) tuples are valid inputs)
        xyvalues = OrderedDict()
        xyvalues['python'] = [(1, 2), (3, 3), (4, 7), (5, 5), (8, 26)]
        xyvalues['pypy'] = [(1, 12), (2, 23), (4, 47), (5, 15), (8, 46)]
        xyvalues['jython'] = [(1, 22), (2, 43), (4, 10), (6, 25), (8, 26)]

        scatter = Scatter(xyvalues, title="Scatter", legend="top_left", ylabel='Languages')

        output_file('scatter.html')
        show(scatter)

    """
    return create_and_build(ScatterBuilder, values, **kws)

class ScatterBuilder(TabularSourceBuilder):
    """This is the Scatter class and it is in charge of plotting
    Scatter charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges. And finally add
    the needed glyphs (markers) taking the references from the source.

    """

    marker = Enum(*_marker_types.keys(), help="""
    The marker type to use (default: ``circle``).
    """)

    def _process_data(self):
        """Parse data received from self._values and create correct x, y
        series values checking if input is a pandas DataFrameGroupBy
        object or one of the stardard supported types (that can be
        converted to a DataAdapter)
        """
        if pd is not None and \
                isinstance(self._values, pd.core.groupby.DataFrameGroupBy):
            return self._parse_groupped_data()
        else:
            if self.couples:
                return self._parse_coupled_data()
            else:
                return self._parse_data()

    @property
    def couples(self):
        for i, val in enumerate(self._values.keys()):
            xy = self._values[val]
            for value in self._values.index:
                try:
                    if len(xy[value]) == 2:
                        return True
                except TypeError:
                    return False
            return False

    def _parse_groupped_data(self):
        """Parse data in self._values in case it's a pandas
        DataFrameGroupBy and create the data 'x_...' and 'y_...' values
        for all data series
        """
        self.x_names = []
        for i, val in enumerate(self._values.keys()):
            xy = self._values[val]
            self._data["%sx_%s" % (self.prefix, val)] = xy[:, 0]
            if not val in self._data:
                self._data[val] = xy[:, 1]
            self.x_names.append("%sx_%s" % (self.prefix, val))

    def _parse_data(self):
        for col, values in self._values.items():
            self._data[col] = values

        if not self.x_names:
            self.x_names = [self.prefix + 'x']
            self._data[self.prefix + 'x'] = self._values.index

        if len(self.x_names) == 1 and self.y_names > 1:
             self.x_names *= len(self.y_names)

    def _parse_coupled_data(self):
        """Parse data in self._values in case it's an iterable (not a pandas
        DataFrameGroupBy) and create the data 'x_...' and 'y_...' values
        for all data series
        """
        self.x_names = []
        for i, val in enumerate(self._values.keys()):
            x_, y_ = [], []
            xy = self._values[val]
            for value in self._values.index:
                x_.append(xy[value][0])
                y_.append(xy[value][1])

            self._data["%sx_%s" % (self.prefix, val)] = x_
            self._data[val] = y_
            self.x_names.append("%sx_%s" % (self.prefix, val))

    def _create_glyph(self, xname, yname, color):
        return make_scatter(self._source, xname, yname, self.marker, color)

    def _adapt_values(self):
        """Prepare context before main show method is invoked.

        Customize show preliminary actions by handling DataFrameGroupBy
        values in order to create the series values and labels."""
        if isinstance(self._values, ColumnDataSource):
            self.source = self._values
            self._values = self.source.data
            self._data = self.source.data

        # check if pandas is installed
        new_values = []
        if pd:
            # if it is we try to take advantage of it's data structures
            # assuming we get an groupby object
            if isinstance(self._values, pd.core.groupby.DataFrameGroupBy):
                pdict = OrderedDict()
                for i in self._values.groups.keys():
                    self._labels = self._values.get_group(i).columns
                    xname = self._values.get_group(i).columns[0]
                    yname = self._values.get_group(i).columns[1]
                    x = getattr(self._values.get_group(i), xname)
                    y = getattr(self._values.get_group(i), yname)
                    pdict[i] = np.array([x.values, y.values]).T

                self._values = new_values = DataAdapter(pdict)

        if not new_values:
            self._values_index, self._values = DataAdapter.get_index_and_data(
                    self._values, self.x_names
                )

        if self.x_names is None:
            self.x_names = []

        if not self.y_names:
            self.y_names = [k for k in self._values.keys() if k not in self.x_names]
