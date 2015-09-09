"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Line class which lets you build your Line charts just
passing the arguments to the Chart class and calling the proper functions.
"""
# -----------------------------------------------------------------------------
# Copyright (c) 2012 - 2014, Continuum Analytics, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------
from __future__ import absolute_import

from .._builder import XYBuilder, create_and_build
from ..glyphs import LineGlyph
from .._attributes import DashAttr, ColorAttr
from ...models.sources import ColumnDataSource


# -----------------------------------------------------------------------------
# Classes and functions
# -----------------------------------------------------------------------------


def Line(data, x=None, y=None, **kws):
    """ Create a line chart using :class:`LineBuilder <bokeh.charts.builder.line_builder.LineBuilder>` to
    render the geometry from values and index.

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

        import numpy as np
        from bokeh.charts import Line, output_file, show

        # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
        xyvalues = np.array([[2, 3, 7, 5, 26], [12, 33, 47, 15, 126], [22, 43, 10, 25, 26]])

        line = Line(xyvalues, title="line", legend="top_left", ylabel='Languages')

        output_file('line.html')
        show(line)

    """
    if x is None and y is not None:
        x = 'index'
    elif x is not None and y is None:
        y = 'index'

    kws['x'] = x
    kws['y'] = y
    return create_and_build(LineBuilder, data, **kws)


class LineBuilder(XYBuilder):
    """This is the Line class and it is in charge of plotting
    Line charts in an easy and intuitive way.
    Essentially, we provide a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed lines taking the references from the source.
    """

    default_attributes = {'color': ColorAttr(),
                          'dash': DashAttr()}

    def _setup(self):

        # handle special case of inputs as measures
        if self.measure_input:

            stack_color = False
            stack_dash = False

            color_columns = self.attributes['color'].columns
            dash_columns = self.attributes['dash'].columns

            # Check if we stack measurements and by which attributes
            if (color_columns is not None and (color_columns == self.y.selection or
                                                       color_columns == self.x.selection)):
                stack_color = True
            if (dash_columns is not None and (dash_columns == self.y.selection or
                                                      dash_columns == self.x.selection)):
                stack_dash = True

            # if we have measures input, we need to stack by something, set default
            if all(attr == False for attr in [stack_color, stack_dash]):
                stack_color = True

            if isinstance(self.y.selection, list):
                self._stack_measures(dim='y', ids=self.x.selection)
            elif isinstance(self.x.selection, list):
                self._stack_measures(dim='x', ids=self.y.selection)

            if stack_color:
                # color by the name of each variable
                self.attributes['color'] = ColorAttr(columns='variable',
                                                     data=ColumnDataSource(self._data.df))
            if stack_dash:
                # color by the name of each variable
                self.attributes['dash'] = DashAttr(columns='variable',
                                                   data=ColumnDataSource(self._data.df))

    @property
    def measure_input(self):
        return isinstance(self.y.selection, list) or isinstance(self.x.selection, list)

    def _stack_measures(self, dim, ids):
        dim_prop = getattr(self, dim)

        # transform our data by stacking the measurements into one column
        self._data.stack_measures(measures=dim_prop.selection, ids=ids)

        # update our dimension with the updated data
        dim_prop.set_data(self._data)

    def _yield_renderers(self):
        for group in self._data.groupby(**self.attributes):
            glyph = LineGlyph(x=group.get_values(self.x.selection),
                              y=group.get_values(self.y.selection),
                              line_color=group['color'],
                              dash=group['dash'])
            renderer = glyph.renderers[0]
            self._legends.append((str(group.label), [renderer]))

            yield renderer
