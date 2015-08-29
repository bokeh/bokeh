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

try:
    import numpy as np

except ImportError:
    raise RuntimeError("bokeh.charts Bar chart requires NumPy.")

from .._builder import Builder, create_and_build
from ...models import ColumnDataSource, FactorRange, GlyphRenderer, Range1d
from ...models.glyphs import Rect
from ...properties import Either, String, Float, HasProps, Instance, ColorSpec
from .._properties import Dimension, Column
from .._attributes import ColorAttr, NestedAttr
from .._glyphs import CompositeGlyph

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


class BarGlyph(CompositeGlyph):
    """Represents a single bar within a bar chart."""

    width = Float(default=0.8)

    def __init__(self, label, values, agg='sum', **kwargs):
        if not isinstance(label, str):
            label = str(label)

        kwargs['label'] = label
        kwargs['values'] = values
        kwargs['agg'] = agg

        super(BarGlyph, self).__init__(**kwargs)

    def aggregate(self):
        width = [self.width]
        height = [getattr(self.values, self.agg)()]
        x = [self.label]
        y = [height[0]/2]
        color = [self.color]

        return ColumnDataSource(dict(x=x, y=y, width=width, height=height, color=color))

    def build(self):
        glyph = Rect(x='x', y='y', width='width', height='height', fill_color='color')
        self.renderers = [GlyphRenderer(data_source=self.source, glyph=glyph)]


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

    label = Dimension('label')
    values = Dimension('values')

    dimensions = ['label', 'values']
    req_dimensions = [['label'],
                      ['values'],
                      ['label', 'values']]

    attributes = {'color': ColorAttr(),
                  'stack': NestedAttr(),
                  'group': NestedAttr()}

    agg = String('sum')

    max_height = Float(1.0)
    bar_width = Float(default=0.8)

    def _setup(self):

        stack = self.attributes['stack']
        group = self.attributes['group']

        # label is equivalent to group
        if stack.columns is None and group.columns is None:
            self.attributes['group'].set_columns(self.label.selection)

        # ToDo: perform aggregation validation
        # Not given values kw, so using only categorical data
        if self.values.computed:
            # agg must be count
            self.agg = 'count'
        else:
            pass

        if self.xlabel is None:
            self.xlabel = str(self.label.selection).title()

        if self.ylabel is None:
            if not self.values.computed:
                self.ylabel = '%s( %s )' % (self.agg.title(), str(self.values.selection).title())
            else:
                self.ylabel = '%s( %s )' % (self.agg.title(), str(self.label.selection).title())

    def _process_data(self):
        """Take the Bar data from the input **value.

        It calculates the chart properties accordingly. Then build a dict
        containing references to all the calculated points to be used by
        the rect glyph inside the ``_yield_renderers`` method.
        """
        pass

    def _set_ranges(self):
        """Push the Bar data into the ColumnDataSource and calculate
        the proper ranges.
        """
        x_items = self.attributes['group']._items
        x_labels = []

        # Items are identified by tuples. If the tuple has a single value, we unpack it
        for item in x_items:
            if len(item) == 1:
                item = item[0]

            x_labels.append(str(item))

        self.x_range = FactorRange(factors=x_labels)
        self.y_range = Range1d(start=0, end=1.1 * self.max_height)

    def _yield_renderers(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the ColumnDataSource.
        """

        color = self.attributes['color']
        stack = self.attributes['stack']
        group_attr = self.attributes['group']

        for group in self._data.groupby(color, stack, group_attr):

            renderer = BarGlyph(label=group.label,
                                values=group.data[self.values.selection].values,
                                agg=self.agg,
                                width=self.bar_width,
                                color=group['color']).renderers[0]

            # a higher level function of bar chart is to keep track of max height of all bars
            self.max_height = max(max(renderer.data_source._data['height']), self.max_height)

            self._legends.append((str(group.label), [renderer]))
            yield renderer
