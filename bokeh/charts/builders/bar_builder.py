"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Bar class which lets you build your Bar charts just passing
the arguments to the Chart class and calling the proper functions.
It also add a new chained stacked method.
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
from __future__ import absolute_import, print_function, division

from ..builder import Builder, create_and_build
from ...models import FactorRange, Range1d
from ..glyphs import BarGlyph
from ...properties import Float, Enum, Bool
from ..properties import Dimension
from ..attributes import ColorAttr, CatAttr
from ..operations import Stack, Dodge
from ...enums import Aggregation
from ..stats import stats
from ...models.sources import ColumnDataSource

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Bar(data, label=None, values=None, color=None, stack=None, group=None, agg="sum", xscale="categorical", yscale="linear",
        xgrid=False, ygrid=True, continuous_range=None, **kw):
    """ Create a Bar chart using :class:`BarBuilder <bokeh.charts.builders.bar_builder.BarBuilder>`
    render the geometry from values, cat and stacked.

    Args:
        data (:ref:`userguide_charts_data_types`): the data
            source for the chart.
        values (str, optional): iterable 2d representing the data series
            values matrix.
        label (list(str) or str, optional): list of string representing the categories.
            (Defaults to None)
        stack (list(str) or str, optional): columns to use for stacking.
            (Defaults to False, so grouping is assumed)
        group (list(str) or str, optional): columns to use for grouping.
        agg (str): how to aggregate the `values`. (Defaults to 'sum', or only label is
            provided, then performs a `count`)
        continuous_range(Range1d, optional): Custom continuous_range to be
            used. (Defaults to None)

    In addition to the parameters specific to this chart,
    :ref:`userguide_charts_defaults` are also accepted as keyword parameters.

    Returns:
        :class:`Chart`: includes glyph renderers that generate bars

    Examples:

        .. bokeh-plot::
            :source-position: above

            from bokeh.charts import Bar, output_file, show, hplot

            # best support is with data in a format that is table-like
            data = {
                'sample': ['1st', '2nd', '1st', '2nd', '1st', '2nd'],
                'interpreter': ['python', 'python', 'pypy', 'pypy', 'jython', 'jython'],
                'timing': [-2, 5, 12, 40, 22, 30]
            }

            # x-axis labels pulled from the interpreter column, stacking labels from sample column
            bar = Bar(data, values='timing', label='interpreter', stack='sample', agg='mean',
                      title="Python Interpreter Sampling", legend='top_right', width=400)

            # table-like data results in reconfiguration of the chart with no data manipulation
            bar2 = Bar(data, values='timing', label=['interpreter', 'sample'],
                       agg='mean', title="Python Interpreters", width=400)

            output_file("stacked_bar.html")
            show(hplot(bar, bar2))

    """
    if continuous_range and not isinstance(continuous_range, Range1d):
        raise ValueError(
            "continuous_range must be an instance of bokeh.models.ranges.Range1d"
        )

    if label is not None and values is None:
        kw['label_only'] = True
        if (agg == 'sum') or (agg == 'mean'):
            agg = 'count'
            values = label

    # The continuous_range is the y_range (until we implement HBar charts)
    y_range = continuous_range
    kw['label'] = label
    kw['values'] = values
    kw['color'] = color
    kw['stack'] = stack
    kw['group'] = group
    kw['agg'] = agg
    kw['xscale'] = xscale
    kw['yscale'] = yscale
    kw['xgrid'] = xgrid
    kw['ygrid'] = ygrid
    kw['y_range'] = y_range

    return create_and_build(BarBuilder, data, **kw)


class BarBuilder(Builder):
    """This is the Bar class and it is in charge of plotting
    Bar chart (grouped and stacked) in an easy and intuitive way.

    Essentially, it provides a way to ingest the data, make the proper
    calculations and push the references into a source object.
    We additionally make calculations for the ranges.
    And finally add the needed glyphs (rects) taking the references
    from the source.

    The x_range is categorical, and is made either from the cat argument
    or from the indexes of the passed values if no cat is supplied.  The
    y_range can be supplied as the parameter continuous_range,
    or will be calculated as a linear range (Range1d) based on the supplied
    values.

    """

    # ToDo: add label back as a discrete dimension
    values = Dimension('values')

    dimensions = ['values']
    #req_dimensions = [['values']]

    default_attributes = {'label': CatAttr(),
                          'color': ColorAttr(),
                          'line_color': ColorAttr(default='white'),
                          'stack': CatAttr(),
                          'group': CatAttr()}

    agg = Enum(Aggregation, default='sum')

    max_height = Float(1.0)
    min_height = Float(0.0)
    bar_width = Float(default=0.8)
    fill_alpha = Float(default=0.8)

    glyph = BarGlyph
    label_attributes = ['stack', 'group']

    label_only = Bool(False)
    values_only = Bool(False)

    def setup(self):

        if self.attributes['color'].columns is None:
            if self.attributes['stack'].columns is not None:
                self.attributes['color'].set_columns(self.attributes['stack'].columns)
            if self.attributes['group'].columns is not None:
                self.attributes['color'].set_columns(self.attributes['group'].columns)

        # ToDo: perform aggregation validation
        # Not given values kw, so using only categorical data
        if self.values.dtype.name == 'object' and len(self.attribute_columns) == 0:
            # agg must be count
            self.agg = 'count'
            self.attributes['label'].set_columns(self.values.selection)
        else:
            pass

        if (self.attributes['label'].columns is None and
            self.values.selection is not None and
                self.glyph == BarGlyph):
            self._data['label'] = 'index'
            self.attributes['label'].setup(data=ColumnDataSource(self._data.df),
                                           columns='index')

        if self.xlabel is None:
            if self.attributes['label'].columns is not None:
                self.xlabel = str(', '.join(self.attributes['label'].columns).title()).title()
            else:
                self.xlabel = self.values.selection

        if self.ylabel is None:
            if not self.label_only:
                self.ylabel = '%s( %s )' % (self.agg.title(), str(self.values.selection).title())
            else:
                self.ylabel = '%s( %s )' % (self.agg.title(), ', '.join(self.attributes['label'].columns).title())

    def set_ranges(self):
        """Push the Bar data into the ColumnDataSource and calculate
        the proper ranges.
        """
        x_items = self.attributes['label'].items
        if x_items is None:
            x_items = ''
        x_labels = []

        # Items are identified by tuples. If the tuple has a single value, we unpack it
        for item in x_items:
            item = self._get_label(item)

            x_labels.append(str(item))

        self.x_range = FactorRange(factors=x_labels)
        y_shift = abs(0.1 * ((self.min_height + self.max_height) / 2))

        if self.min_height < 0:
            start = self.min_height - y_shift
        else:
            start = 0.0

        if self.max_height > 0:
            end = self.max_height + y_shift
        else:
            end = 0.0

        self.y_range = Range1d(start=start, end=end)

    def get_extra_args(self):
        if self.__class__ is not BarBuilder:
            attrs = self.class_properties(withbases=False)
            return {attr: getattr(self, attr) for attr in attrs}
        else:
            return {}

    def collect_glyph_kwargs(self, group):
        attrs = set(self.default_attributes.keys()) - set(
            BarBuilder.default_attributes.keys())
        return {attr: group[attr] for attr in attrs}

    def yield_renderers(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the ColumnDataSource.
        """
        kwargs = self.get_extra_args()

        for group in self._data.groupby(**self.attributes):
            glyph_kwargs = self.collect_glyph_kwargs(group)
            group_kwargs = kwargs.copy()
            group_kwargs.update(glyph_kwargs)

            bg = self.glyph(label=self._get_label(group['label']),
                            values=group.data[self.values.selection].values,
                            agg=stats[self.agg](),
                            width=self.bar_width,
                            color=group['color'],
                            line_color=group['line_color'],
                            fill_alpha=self.fill_alpha,
                            stack_label=self._get_label(group['stack']),
                            dodge_label=self._get_label(group['group']),
                            **group_kwargs)

            self.add_glyph(group, bg)

        Stack().apply(self.comp_glyphs)
        Dodge().apply(self.comp_glyphs)

        # a higher level function of bar chart is to keep track of max height of all bars
        self.max_height = max([renderer.y_max for renderer in self.comp_glyphs])
        self.min_height = min([renderer.y_min for renderer in self.comp_glyphs])

        for renderer in self.comp_glyphs:
            for sub_renderer in renderer.renderers:
                yield sub_renderer
