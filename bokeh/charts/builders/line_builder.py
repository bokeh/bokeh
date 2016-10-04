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
from ..glyphs import LineGlyph, PointGlyph
from ..attributes import DashAttr, ColorAttr, MarkerAttr
from ..data_source import NumericalColumnsAssigner
from ...models.sources import ColumnDataSource
from ...core.properties import Bool, String, List
from ..operations import Stack, Dodge
from ..utils import add_tooltips_columns


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

    In addition to the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    .. note::
        This chart type differs on input types as compared to other charts,
        due to the way that line charts typically are plotting labeled series. For
        example, a column for AAPL stock prices over time. Another way this could be
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

    series_names = List(String, help="""Names that represent the items being plotted.""")
    stack = Bool(default=False)

    default_attributes = {'color': ColorAttr(),
                          'dash': DashAttr(),
                          'marker': MarkerAttr()}

    dimensions = ['y', 'x']

    column_selector = NumericalColumnsAssigner

    glyph = LineGlyph

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

    @property
    def stack_flags(self):
        # Check if we stack measurements and by which attributes
        # This happens if we used the same series labels for dimensions as attributes
        return {k: self.attr_measurement(k) for k in list(
            self.attributes.keys())}

    def get_id_cols(self, stack_flags):

        # collect the other columns used as identifiers, that aren't a measurement name
        id_cols = [self.attributes[attr].columns
                   for attr, stack in iteritems(stack_flags) if not stack and
                   self.attributes[attr].columns != self.measures and
                   self.attributes[attr].columns is not None]
        return list(chain.from_iterable(id_cols))

    def setup(self):
        """Handle input options that require transforming data and/or user selections."""

        # handle special case of inputs as measures
        if self.measure_input:
            stack_flags = self.stack_flags
            id_cols = self.get_id_cols(stack_flags)

            # if we have measures input, we need to stack by something, set default
            if all(attr is False for attr in list(stack_flags.values())):
                stack_flags['color'] = True

            # stack the measurement dimension while keeping id columns
            self._stack_measures(ids=id_cols)

            # set the attributes to key off of the name of the stacked measurement
            source = ColumnDataSource(self._data.df)
            for attr_name, stack_flag in iteritems(stack_flags):
                if stack_flags[attr_name]:
                    default_attr = self.attributes[attr_name]
                    default_attr.setup(columns='series', data=source)

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

    def set_series(self, col_name):
        series = self._data.df[col_name].drop_duplicates().tolist()
        series = [str(item) for item in series]
        self.series_names = series

    def _stack_measures(self, ids, var_name='series'):
        """Stack data and keep the ids columns.

        Args:
            ids (list(str)): the column names that describe the measures

        """
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
        self._data.stack_measures(measures=dim_prop.selection, ids=ids,
                                  var_name=var_name)

        # update our dimension with the updated data
        dim_prop.set_data(self._data)

        self.set_series('series')

    def get_builder_attr(self):
        attrs = self.properties()
        return {attr: getattr(self, attr) for attr in attrs
                if attr in self.glyph.properties()}

    def yield_renderers(self):

        build_attr = self.get_builder_attr()

        # get the list of builder attributes and only pass them on if glyph supports
        attrs = list(self.attributes.keys())
        attrs = [attr for attr in attrs if attr in self.glyph.properties()]

        for group in self._data.groupby(**self.attributes):

            group_kwargs = self.get_group_kwargs(group, attrs)
            group_kwargs.update(build_attr)

            glyph = self.glyph(label=group.label,
                               x=group.get_values(self.x.selection),
                               y=group.get_values(self.y.selection),
                               **group_kwargs)

            # dash=group['dash']
            # save reference to composite glyph
            self.add_glyph(group, glyph)

            # yield each renderer produced by composite glyph
            for renderer in glyph.renderers:

                if self.tooltips:
                    renderer = add_tooltips_columns(renderer, self.tooltips, group)

                yield renderer

        if self.stack:
            Stack().apply(self.comp_glyphs)
        Dodge().apply(self.comp_glyphs)


class PointSeriesBuilder(LineBuilder):
    glyph = PointGlyph
