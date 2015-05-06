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
        index (str|1d iterable, optional): can be used to specify a common custom
            index for all data series as an **1d iterable** of any sort that will be used as
            series common index or a **string** that corresponds to the key of the
            mapping to be used as index (and not as data series) if
            area.values is a mapping (like a dict, an OrderedDict
            or a pandas DataFrame)

    In addition the the parameters specific to this chart,
        :ref:`userguide_charts_generic_arguments` are also accepted as keyword parameters.

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
    return create_and_build(AreaBuilder, values, index=index, **kws)


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

    index = Any(help="""
    An index to be used for all data series as follows:

    - A 1d iterable of any sort that will be used as
        series common index

    - As a string that corresponds to the key of the
        mapping to be used as index (and not as data
        series) if area.values is a mapping (like a dict,
        an OrderedDict or a pandas DataFrame)

    """)

    def _process_data(self):
        """Calculate the chart properties accordingly from area.values.
        Then build a dict containing references to all the points to be used by
        the patch glyph inside the ``_yield_renderers`` method.

        """
        xs = self._values_index
        last = np.zeros(len(xs))
        x2 = np.hstack((xs[::-1], xs))
        self.set_and_get("x", "", x2)

        for grp, col_values in self._values.items():
            # TODO: This condition may be removed or changed depending on
            # the validation of self.index
            if isinstance(self.index, string_types) and grp == self.index:
                continue

            # get single series values
            _values = [col_values[x] for indx, x in enumerate(xs)]

            # to draw area we need 2 coordinates. The lower values will always
            # be:
            # - 0 in case of non stacked area
            # - the previous series top value in case of stacked charts
            next = last + _values
            values = np.hstack((last[::-1], next))

            # only update when stacked, otherwise we always want to start from 0
            if self.stacked:
                last = next

            # save values and new group
            self.set_and_get("y_", grp, values)
            self._groups.append(u"%s" % grp)

    def _set_sources(self):
        """
        Push the Line data into the ColumnDataSource and calculate the proper ranges.
        """
        self._source = ColumnDataSource(self._data)
        self.x_range = DataRange1d()
        y_names = self._attr[1:]
        endy = max(max(self._data[i]) for i in y_names)
        starty = min(min(self._data[i]) for i in y_names)
        self.y_range =  Range1d(
            start=starty - 0.1 * (endy - starty),
            end=endy + 0.1 * (endy - starty)
        )

    def _yield_renderers(self):
        """Use the patch glyphs to fill the area connecting the xy points
         in the series taken from the data added with area._process_data.

        Takes reference points from the data loaded at the ColumnDataSource.
        """
        colors = cycle_colors(self._attr, self.palette)
        # parse all series. We exclude the first attr as it's the x values
        # added for the index
        for i, series_name in enumerate(self._attr[1:]):

            glyph = Patch(
                x='x', y=series_name, fill_color=colors[i], fill_alpha=0.9)
            renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
            self._legends.append((self._groups[i], [renderer]))
            yield renderer
