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
from collections import defaultdict

try:
    import numpy as np

except ImportError:
    raise RuntimeError("bokeh.charts Bar chart requires NumPy.")

from .._builder import Builder, create_and_build
from ...models import FactorRange, Range1d
from ..glyphs import BarGlyph
from ...properties import Float, Enum
from .._properties import Dimension
from .._attributes import ColorAttr, GroupAttr
from ..operations import Stack, Dodge
from ...enums import Aggregation
from ..stats import stats

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Bar(data, label=None, values=None, color=None, stack=None, group=None, agg="sum", xscale="categorical", yscale="linear",
        xgrid=False, ygrid=True, continuous_range=None, **kw):
    """ Create a Bar chart using :class:`BarBuilder <bokeh.charts.builder.bar_builder.BarBuilder>`
    render the geometry from values, cat and stacked.

    Args:
        values (iterable): iterable 2d representing the data series
            values matrix.
        cat (list or bool, optional): list of string representing the categories.
            (Defaults to None)
        stacked (bool, optional): to see the bars stacked or grouped.
            (Defaults to False, so grouping is assumed)
        continuous_range(Range1d, optional): Custom continuous_range to be
            used. (Defaults to None)

    In addition the the parameters specific to this chart,
    :ref:`userguide_charts_generic_arguments` are also accepted as keyword parameters.

    Returns:
        a new :class:`Chart <bokeh.charts.Chart>`

    Examples:

        .. bokeh-plot::
            :source-position: above

            from collections import OrderedDict
            from bokeh.charts import Bar, output_file, show

            # (dict, OrderedDict, lists, arrays and DataFrames are valid inputs)
            xyvalues = OrderedDict()
            xyvalues['python']=[-2, 5]
            xyvalues['pypy']=[12, 40]
            xyvalues['jython']=[22, 30]

            cat = ['1st', '2nd']

            bar = Bar(xyvalues, cat, title="Stacked bars",
                    xlabel="category", ylabel="language")

            output_file("stacked_bar.html")
            show(bar)

    """
    if continuous_range and not isinstance(continuous_range, Range1d):
        raise ValueError(
            "continuous_range must be an instance of bokeh.models.ranges.Range1d"
        )

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
    values using the following rules:

     * with all positive data: start = 0, end = 1.1 * max
     * with all negative data: start = 1.1 * min, end = 0
     * with mixed sign data:   start = 1.1 * min, end = 1.1 * max

    """

    # ToDo: add label back as a discrete dimension
    values = Dimension('values')

    dimensions = ['values']
    #req_dimensions = [['values']]

    default_attributes = {'label': GroupAttr(),
                          'color': ColorAttr(),
                          'stack': GroupAttr(),
                          'group': GroupAttr()}

    agg = Enum(Aggregation, default='sum')

    max_height = Float(1.0)
    min_height = Float(0.0)
    bar_width = Float(default=0.8)

    glyph = BarGlyph

    def _setup(self):

        if self.attributes['color'].columns is None:
            if self.attributes['stack'].columns is not None:
                self.attributes['color'].set_columns(self.attributes['stack'].columns)
            if self.attributes['group'].columns is not None:
                self.attributes['color'].set_columns(self.attributes['group'].columns)

        # ToDo: perform aggregation validation
        # Not given values kw, so using only categorical data
        if self.values.computed:
            # agg must be count
            self.agg = 'count'
        else:
            pass

        if self.xlabel is None:
            if self.attributes['label'].columns is not None:
                self.xlabel = str(', '.join(self.attributes['label'].columns).title()).title()
            elif self.values.selection is not None:
                selected_value_cols = self.values.selection
                if not isinstance(selected_value_cols, list):
                    selected_value_cols = [selected_value_cols]
                self.xlabel = str(', '.join(selected_value_cols).title()).title()

        if self.ylabel is None:
            if not self.values.computed:
                self.ylabel = '%s( %s )' % (self.agg.title(), str(self.values.selection).title())
            else:
                self.ylabel = '%s( %s )' % (self.agg.title(), ', '.join(self.attributes['label'].columns).title())

    def _set_ranges(self):
        """Push the Bar data into the ColumnDataSource and calculate
        the proper ranges.
        """
        x_items = self.attributes['label']._items
        x_labels = []

        # Items are identified by tuples. If the tuple has a single value, we unpack it
        for item in x_items:
            item = self._get_label(item)

            x_labels.append(str(item))

        self.x_range = FactorRange(factors=x_labels)
        y_shift = 0.1 * ((self.max_height + self.max_height) / 2)
        if self.glyph == BarGlyph:
            start = 0.0
        else:
            start = self.min_height - y_shift

        self.y_range = Range1d(start=start, end=self.max_height + y_shift)

    def add_renderer(self, group, renderer):

        if isinstance(renderer, list):
            for sub_renderer in renderer:
                self.renderers.append(sub_renderer)
        else:
            self.renderers.append(renderer)

        # ToDo: support grouping and stacking at the same time
        if self.attributes['stack'].columns is not None:
            label = self._get_label(group['stack'])
        elif self.attributes['group'].columns is not None:
            label = self._get_label(group['group'])
        else:
            label = None

        # add to legend if new and unique label
        if str(label) not in self.labels and label is not None:
            self._legends.append((label, renderer.renderers))
            self.labels.append(label)

    @staticmethod
    def _get_label(item):
        if item is None:
            return item
        elif len(item) == 1:
            item = item[0]
        return str(item)

    def _yield_renderers(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the ColumnDataSource.
        """

        for group in self._data.groupby(**self.attributes):

            bg = self.glyph(label=self._get_label(group['label']),
                            values=group.data[self.values.selection].values,
                            agg=stats[self.agg](),
                            width=self.bar_width,
                            color=group['color'],
                            stack_label=self._get_label(group['stack']),
                            dodge_label=self._get_label(group['group']))

            self.add_renderer(group, bg)

        Stack().apply(self.renderers)
        Dodge().apply(self.renderers)

        # a higher level function of bar chart is to keep track of max height of all bars
        self.max_height = max([renderer.y_max for renderer in self.renderers])
        self.min_height = min([renderer.y_min for renderer in self.renderers])

        for renderer in self.renderers:
            for sub_renderer in renderer.renderers:
                yield sub_renderer
