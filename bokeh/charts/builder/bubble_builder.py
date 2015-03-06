"""This is the Bokeh charts interface. It gives you a high level API
to build complex plot is a simple way.

This is the Bubble class which lets you build your Bubble charts
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
from six import string_types
import numpy as np

try:
    import pandas as pd
except:
    pd = None

from ..utils import chunk, cycle_colors, make_scatter
from .._builder import create_and_build
from ...models import ColumnDataSource, Range1d
from ...properties import Any, Float
from .scatter_builder import ScatterBuilder

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Bubble(values, sizes, **kws):
    """ Create a Bubble chart using :class:`BubbleBuilder <bokeh.charts.builder.bubble_builder.BubbleBuilder>`
    to render the geometry from values.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.
        sizes (iterable(str|1d iterable)|str|1d iterable): can be used to specify a
            a series of any sort that will be used to define the bubbles
            size. It can be specified as an **1d iterable** with values
            representing the bubbles size or a **string**|**int** that
            corresponds to the key of the mapping on series of values
            to be used for sizes and not x, y position [if
            area.values is a mapping (like a dict, an OrderedDict
            or a pandas DataFrame)]

    In addition the the parameters specific to this chart,
    :ref:`charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

    .. bokeh-plot::
        :source-position: above

        from collections import OrderedDict
        from bokeh.charts import Bubble
        from bokeh.plotting import output_file, show

        # (dict, OrderedDict, lists, arrays and DataFrames of (x, y) tuples are valid inputs)
        xyvalues = OrderedDict()
        xyvalues['python'] = [(1, 2), (3, 3), (4, 7), (5, 5), (8, 26)]
        xyvalues['pypy'] = [(1, 12), (2, 23), (4, 47), (5, 15), (8, 46)]
        xyvalues['jython'] = [(1, 22), (2, 43), (4, 10), (6, 25), (8, 26)]
        output_file('bubbles.html')
        bubbles = Bubble(xyvalues, sizes=[[1,4,3,6,7], [5,5,2,1,5], [4,2,5,8,8]]
        title="Bubbles", legend="top_left", ylabel='Languages')
        show(bubbles)

    """
    return create_and_build(BubbleBuilder, values, sizes=sizes, **kws)

class BubbleBuilder(ScatterBuilder):
    """This is the Bubble class and it is in charge of plotting
    Bubble charts in an easy and intuitive way.

    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges. And finally add
    the needed glyphs (markers) taking the references from the source.

    # """
    sizes = Any("circle", help="""
    An index to be used for all data series.
    """)
    max_bubble_size = Float(40., help="""
    Maximum size of a bubble marker.

    .. note::
        This corresponds directly to the size argument marker used

    """)

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


    def _set_sources(self):
        """Push the bubble data into the ColumnDataSource and
        calculate the proper ranges."""
        x_names = [name for name in self._data if name.startswith('x_')]
        y_names = [name for name in self._data if name.startswith('y_')]

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

        for i, (name, size) in enumerate(zip(self._groups, self.sizes)):
            if isinstance(size, string_types):
                ds = self._values[size]
            else:
                # assuming it's an iterable to use as
                ds = size

            min_size, max_size = min(ds), max(ds)
            f = np.vectorize(lambda x: x/float(max_size) * self.max_bubble_size)
            self._data["_%s_sizes" % name] = f(ds)

        self._source = ColumnDataSource(self._data)

    def _yield_renderers(self):
        """Use the marker glyphs to display the points.

        Takes reference points from data loaded at the ColumnDataSource.
        """
        duplets = list(chunk(self._attr, 2))
        colors = cycle_colors(duplets, self.palette)

        # for i, duplet in enumerate(duplets, start=1):
        for i, gr in enumerate(self._groups):
            renderer = make_scatter(
                self._source, "x_%s" % gr, "y_%s" % gr, self.marker,
                colors[i], fill_alpha=0.4, line_alpha=0.4, size="_%s_sizes" % gr
            )
            self._legends.append((self._groups[i], [renderer]))
            yield renderer
