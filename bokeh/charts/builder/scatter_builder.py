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

from ..utils import chunk, cycle_colors, marker_types
from .._builder import create_and_build, Builder
from .._data_source import ChartDataSource
from ...models import ColumnDataSource, Range1d
from ...properties import String
from ...models import GlyphRenderer
from .._attributes import AttrSpec, color_spec

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Scatter(*args, **kws):
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
    return create_and_build(ScatterBuilder, *args, **kws)


def scatter_glyph(x, y, line_color='blue', fill_color='blue', marker='circle', size=5):
    """Produces a glyph that represents one distinct group of data."""

    return marker_types[marker](x=x, y=y, line_color=line_color, fill_color=fill_color, size=size)


class ScatterBuilder(Builder):
    """This is the Scatter class and it is in charge of plotting
    Scatter charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges. And finally add
    the needed glyphs (markers) taking the references from the source.

    """

    # TODO: (bev) should be an enumeration
    x = String()
    y = String()

    marker = String(help="""
    The marker type to use (default: ``circle``).
    """)

    color = String()

    def _process_data(self):
        """Take the scatter.values data to calculate the chart properties
        accordingly. Then build a dict containing references to all the
        calculated points to be used by the marker glyph inside the
        ``_yield_renderers`` method.
        """
        #self._data = dict()
        # list to save all the attributes we are going to create
        self._attr = []

    def _set_sources(self):
        """Push the Scatter data into the ColumnDataSource and
        calculate the proper ranges."""
        #self._source = ColumnDataSource(self._data)
        # ToDo: handle when only single dimension is provided

        #x_names, y_names = self._attr[::2], self._attr[1::2]
        x = self._data['x']
        y = self._data['y']

        endx = self._data.df[x].max()
        startx = self._data.df[x].min()
        self.x_range = Range1d(
            start=startx - 0.1 * (endx - startx),
            end=endx + 0.1 * (endx - startx)
        )

        endy = self._data.df[y].max()
        starty = self._data.df[y].min()
        self.y_range = Range1d(
            start=starty - 0.1 * (endy - starty),
            end=endy + 0.1 * (endy - starty)
        )

    def _yield_renderers(self):
        """Use the marker glyphs to display the points.

        Takes reference points from data loaded at the ColumnDataSource.
        """

        color = color_spec(self._data.df, cols=self.color, palette=self.palette)
        marker = AttrSpec(self._data.df, columns=self.marker, default='circle',
                               attribute='marker', iterable=marker_types.keys())

        for group in self._data.groupby(color, marker):

            glyph = scatter_glyph(self._data['x'], self._data['y'],
                                  line_color=group['color'], fill_color=group['color'],
                                  marker=group['marker'])

            yield GlyphRenderer(data_source=group.source, glyph=glyph)

            #self.legends.append((self._groups[i-1], [renderer]))
            #yield renderer
