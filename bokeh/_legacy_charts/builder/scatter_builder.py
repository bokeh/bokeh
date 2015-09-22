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

from ..utils import chunk, cycle_colors, make_scatter
from .._builder import create_and_build, Builder
from .._data_adapter import DataAdapter
from ...models import ColumnDataSource, Range1d
from ...properties import String

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
    :ref:`userguide_charts_generic_arguments` are also accepted as keyword parameters.

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

class ScatterBuilder(Builder):
    """This is the Scatter class and it is in charge of plotting
    Scatter charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges. And finally add
    the needed glyphs (markers) taking the references from the source.

    """

    # TODO: (bev) should be an enumeration
    marker = String("circle", help="""
    The marker type to use (default: ``circle``).
    """)

    def _process_data(self):
        """Take the scatter.values data to calculate the chart properties
        accordingly. Then build a dict containing references to all the
        calculated points to be used by the marker glyph inside the
        ``_yield_renderers`` method.
        """
        self._data = dict()
        # list to save all the attributes we are going to create
        self._attr = []
        # list to save all the groups available in the incoming input
        self._groups.extend(self._values.keys())
        # Grouping
        self.parse_data()

    @property
    def parse_data(self):
        """Parse data received from self._values and create correct x, y
        series values checking if input is a pandas DataFrameGroupBy
        object or one of the stardard supported types (that can be
        converted to a DataAdapter)
        """
        if pd is not None and \
                isinstance(self._values, pd.core.groupby.DataFrameGroupBy):
            return self._parse_groupped_data
        else:
            return self._parse_data

    def _parse_groupped_data(self):
        """Parse data in self._values in case it's a pandas
        DataFrameGroupBy and create the data 'x_...' and 'y_...' values
        for all data series
        """
        for i, val in enumerate(self._values.keys()):
            xy = self._values[val]
            self._set_and_get("x_", val, xy[:, 0])
            self._set_and_get("y_", val, xy[:, 1])

    def _parse_data(self):
        """Parse data in self._values in case it's an iterable (not a pandas
        DataFrameGroupBy) and create the data 'x_...' and 'y_...' values
        for all data series
        """
        for i, val in enumerate(self._values.keys()):
            x_, y_ = [], []
            xy = self._values[val]
            for value in self._values.index:
                x_.append(xy[value][0])
                y_.append(xy[value][1])

            self.set_and_get("x_", val, x_)
            self.set_and_get("y_", val, y_)

    def _set_sources(self):
        """Push the Scatter data into the ColumnDataSource and
        calculate the proper ranges."""
        self._source = ColumnDataSource(self._data)

        x_names, y_names = self._attr[::2], self._attr[1::2]
        endx = max(max(self._data[i]) for i in x_names)
        startx = min(min(self._data[i]) for i in x_names)
        self.x_range = Range1d(
            start=startx - 0.1 * (endx - startx),
            end=endx + 0.1 * (endx - startx)
        )
        endy = max(max(self._data[i]) for i in y_names)
        starty = min(min(self._data[i]) for i in y_names)
        self.y_range = Range1d(
            start=starty - 0.1 * (endy - starty),
            end=endy + 0.1 * (endy - starty)
        )

    def _yield_renderers(self):
        """Use the marker glyphs to display the points.

        Takes reference points from data loaded at the ColumnDataSource.
        """
        duplets = list(chunk(self._attr, 2))
        colors = cycle_colors(duplets, self.palette)

        for i, duplet in enumerate(duplets, start=1):
            renderer = make_scatter(
                self._source, duplet[0], duplet[1], self.marker, colors[i - 1]
            )
            self._legends.append((self._groups[i-1], [renderer]))
            yield renderer

    def _adapt_values(self):
        """Prepare context before main show method is invoked.

        Customize show preliminary actions by handling DataFrameGroupBy
        values in order to create the series values and labels."""
        # check if pandas is installed
        if pd:
            # if it is we try to take advantage of it's data structures
            # asumming we get an groupby object
            if isinstance(self._values, pd.core.groupby.DataFrameGroupBy):
                pdict = OrderedDict()

                for i in self._values.groups.keys():
                    self._labels = self._values.get_group(i).columns
                    xname = self._values.get_group(i).columns[0]
                    yname = self._values.get_group(i).columns[1]
                    x = getattr(self._values.get_group(i), xname)
                    y = getattr(self._values.get_group(i), yname)
                    pdict[i] = np.array([x.values, y.values]).T

                self._values = DataAdapter(pdict)
                self._labels = self._values.keys()
            else:
                self._values = DataAdapter(self._values)
                self._labels = self._values.keys()

        else:
            self._values = DataAdapter(self._values)
            self._labels = self._values.keys()
