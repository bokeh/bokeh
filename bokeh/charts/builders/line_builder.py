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

from six import iteritems
from itertools import chain
from ..builder import XYBuilder, create_and_build
from ..glyphs import LineGlyph
from ..attributes import DashAttr, ColorAttr
from ..data_source import NumericalColumnsAssigner
from ...models.sources import ColumnDataSource

# -----------------------------------------------------------------------------
# Classes and functions
# -----------------------------------------------------------------------------


def Line(data=None, x=None, y=None, **kws):
    """ Create a line chart using :class:`LineBuilder <bokeh.charts.builders.line_builder.LineBuilder>` to
    render the glyphs.

    The line chart is typically is used with column oriented data, where each column
    contains comparable measurements and the column names are treated as a categorical
    variable for differentiating the measurement values. One of the columns can be used as
    an index for either the x or y axis.

    .. note::
        Only the x or y axis can display multiple variables, while the other is used
        as an index.

    Args:
        data (list(list), numpy.ndarray, pandas.DataFrame, list(pd.Series)): a 2d data
            source with columns of data for each line.
        x (str or list(str), optional): specifies variable(s) to use for x axis
        y (str or list(str), optional): specifies variable(s) to use for y axis

    In addition the the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    .. note::
        This chart type differs on input types as compared to other charts,
        due to the way that line charts typically are plotting labeled series. For
        example, a column for APPL stock prices over time. Another way this could be
        plotted is to have a DataFrame with a column of `stock_label` and columns of
        `price`, which is the stacked format. Both should be supported, but the former
        is the expected one. Internally, the latter format is being derived.

    Returns:
        :class:`Chart`: includes glyph renderers that generate the lines

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

    dimensions = ['y', 'x']

    column_selector = NumericalColumnsAssigner

    @property
    def measures(self):
        if isinstance(self.y.selection, list):
            return self.y.selection
        elif isinstance(self.x.selection, list):
            return self.x.selection
        else:
            return None

    @property
    def measure_input(self):
        return isinstance(self.y.selection, list) or isinstance(self.x.selection, list)

    def setup(self):
        """Handle input options that require transforming data and/or user selections."""

        # handle special case of inputs as measures
        if self.measure_input:

            # Check if we stack measurements and by which attributes
            stack_flags = {'color': self.attr_measurement('color'),
                           'dash': self.attr_measurement('dash')}

            # collect the other columns used as identifiers, that aren't a measurement name
            id_cols = [self.attributes[attr].columns
                       for attr, stack in iteritems(stack_flags) if not stack and
                       self.attributes[attr].columns != self.measures and
                       self.attributes[attr].columns is not None]
            id_cols = list(chain.from_iterable(id_cols))

            # if we have measures input, we need to stack by something, set default
            if all(attr is False for attr in list(stack_flags.values())):
                stack_flags['color'] = True

            # stack the measurement dimension while keeping id columns
            self._stack_measures(ids=id_cols)

            # set the attributes to key off of the name of the stacked measurement, if stacked
            if stack_flags['color']:
                # color by the name of each variable
                self.attributes['color'] = ColorAttr(columns='variable',
                                                     data=ColumnDataSource(self._data.df))

            if stack_flags['dash']:
                # dash by the name of each variable
                self.attributes['dash'] = DashAttr(columns='variable',
                                                   data=ColumnDataSource(self._data.df))

        # Handle when to use special column names
        if self.x.selection is None and self.y.selection is not None:
            self.x.selection = 'index'
        elif self.x.selection is not None and self.y.selection is None:
            self.y.selection = 'index'

    def attr_measurement(self, attr_name):
        """Detect if the attribute has been given measurement columns."""
        cols = self.attributes[attr_name].columns
        return (cols is not None and (cols == self.y.selection or
                                      cols == self.x.selection))

    def _stack_measures(self, ids):
        """Transform data so that id columns are kept and measures are stacked in single column."""
        if isinstance(self.y.selection, list):
            dim = 'y'
            if self.x.selection is not None:
                ids.append(self.x.selection)
        else:
            dim = 'x'
            if self.y.selection is not None:
                ids.append(self.y.selection)

        if len(ids) == 0:
            ids = None

        dim_prop = getattr(self, dim)

        # transform our data by stacking the measurements into one column
        self._data.stack_measures(measures=dim_prop.selection, ids=ids)

        # update our dimension with the updated data
        dim_prop.set_data(self._data)

    def yield_renderers(self):
        for group in self._data.groupby(**self.attributes):
            glyph = LineGlyph(x=group.get_values(self.x.selection),
                              y=group.get_values(self.y.selection),
                              line_color=group['color'],
                              dash=group['dash'])

            # save reference to composite glyph
            self.add_glyph(group, glyph)

            # yield each renderer produced by composite glyph
            for renderer in glyph.renderers:
                yield renderer
