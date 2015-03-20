"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Area class which lets you build your Area charts just passing
the arguments to the Chart class and calling the proper functions.
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
from __future__ import absolute_import, print_function

from six import string_types

try:
    import numpy as np

except ImportError:
    raise RuntimeError("bokeh.charts Area chart requires NumPy.")

from ..utils import cycle_colors
from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, DataRange1d, GlyphRenderer, Range1d
from ...models.glyphs import Patch
from ...properties import Any, Bool

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Area(values, index=None, **kws):
    """ Create an area chart using the :class:`AreaBuilder <bokeh.charts.builder.area_builder.AreaBuilder>`
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

            from bokeh.charts import Area, output_file, show

            # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
            xyvalues = dict(
                python=[2, 3, 7, 5, 26, 221, 44, 233, 254, 265, 266, 267, 120],
                pypy=[12, 33, 47, 15, 126, 121, 144, 233, 254, 225, 226, 267, 110],
                jython=[22, 43, 10, 25, 26, 101, 114, 203, 194, 215, 201, 227, 139],
            )

            area = Area(
                xyvalues, title="Area Chart", xlabel='time', legend=True,
                ylabel='memory', stacked=True,
            )

            output_file('area.html')
            show(area)
    """
    return create_and_build(AreaBuilder, values, **kws)


class AreaBuilder(Builder):
    """This is the Area class and it is in charge of plotting
    Area chart in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (patch) taking the references
    from the source.

    """

    stacked = Bool(False, help="""
    Whether to stack the areas. (Defaults to False)

    If True, areas are draw as a stack, to show the relationship of
    parts to a whole. Otherwise, areas are layered above one another.

    """)

    def _process_data(self):
        """Calculate the chart properties accordingly from area.values.
        Then build a dict containing references to all the points to be used by
        the patch glyph inside the ``_yield_renderers`` method.

        """
        xs = self._values_index
        last = np.zeros(len(xs))
        x2 = np.hstack((xs[::-1], xs))
        self._data['area_x'] = x2

        for col, col_values in self._values.items():
            if col in self.y_names:
                # to draw area we need 2 coordinates. The lower values will always
                # be:
                # - 0 in case of non stacked area
                # - the previous series top value in case of stacked charts
                next = last + col_values
                values = np.hstack((last[::-1], next))

                # only update when stacked, otherwise we always want to start from 0
                if self.stacked:
                    last = next

                self._data['area_%s' % col] = values

            # add the original series to _data so it can be found in source
            # and can also be used for tooltips..
            if not col in self._data:
                self._data[col] = col_values

    def _set_ranges(self):
        """
        Push the Line data into the ColumnDataSource and calculate the proper ranges.
        """
        self.x_range = DataRange1d(sources=[self._source.columns("area_x")])
        y_sources = [self.source.columns("area_%s" % col) for col in self.y_names]
        self.y_range = DataRange1d(sources=y_sources)

    def _yield_renderers(self):
        """Use the patch glyphs to fill the area connecting the xy points
         in the series taken from the data added with area._process_data.

        Takes reference points from the data loaded at the ColumnDataSource.
        """
        colors = cycle_colors(self.y_names, self.palette)
        for color, name in zip(colors, self.y_names):
            # draw the step horizontal segment
            glyph = Patch(
                x='area_x', y="area_%s" % name, fill_color=color, fill_alpha=0.9)
            renderer = GlyphRenderer(data_source=self.source, glyph=glyph)
            self._legends.append((name, [renderer]))
            yield renderer