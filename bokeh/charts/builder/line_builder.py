"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Line class which lets you build your Line charts just
passing the arguments to the Chart class and calling the proper functions.
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

from six import string_types
import numpy as np

from ..utils import cycle_colors
from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, DataRange1d, GlyphRenderer, Range1d
from ...models.glyphs import Line as LineGlyph
from warnings import warn
#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------

def Line(values, index=None, **kws):
    """ Create a line chart using :class:`LineBuilder <bokeh.charts.builder.line_builder.LineBuilder>` to
    render the geometry from values and index.

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

        import numpy as np
        from bokeh.charts import Line, output_file, show

        # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
        xyvalues = np.array([[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]])

        line = Line(xyvalues, title="line", legend="top_left", ylabel='Languages')

        output_file('line.html')
        show(line)

    """
    if index is not None:
        msg = "bokeh.charts.Line index argument is deprecated since Bokeh 0.8.2. Use x_names instead!"
        warn(msg, DeprecationWarning, stacklevel=2)
        kws['x_names'] = index

    return create_and_build(LineBuilder, values,  **kws)


class LineBuilder(Builder):
    """This is the Line class and it is in charge of plotting
    Line charts in an easy and intuitive way.
    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed lines taking the references from the source.
    """

    def _process_data(self):
        """Calculate the chart properties accordingly from line.values.
        Then build a dict containing references to all the points to be
        used by the line glyph inside the ``_yield_renderers`` method.
        """
        self._data = dict()

        # list to save all the attributes we are going to create
        for col, values in self._values.items():
            self._data[col] = values

        for xname in self.x_names:
            if xname not in self._data:
                self._data[xname] = np.array(self._values_index)

    def _set_sources(self):
        """
        Push the Line data into the ColumnDataSource and calculate the
        proper ranges.
        """
        self._source = ColumnDataSource(self._data)
        self.x_range = DataRange1d(
            sources=[self._source.columns(*self.x_names)]
        )
        data = self._source.data
        endy = max(max(data[i]) for i in self.y_names)
        starty = min(min(data[i]) for i in self.y_names)
        self.y_range = Range1d(
            start=starty - 0.1 * (endy - starty),
            end=endy + 0.1 * (endy - starty)
        )

    def _yield_renderers(self):
        """Use the line glyphs to connect the xy points in the Line.
        Takes reference points from the data loaded at the ColumnDataSource.
        """
        colors = cycle_colors(self.y_names, self.palette)
        if len(self.x_names) == len(self.y_names):
            xnames = self.x_names
        else:
            xnames = len(self.y_names) * self.x_names

        for color, xname, yname in zip(colors, xnames, self.y_names):
            glyph = LineGlyph(x=xname, y=yname, line_color=color)
            renderer = GlyphRenderer(data_source=self._source, glyph=glyph)
            self._legends.append((yname, [renderer]))
            yield renderer
