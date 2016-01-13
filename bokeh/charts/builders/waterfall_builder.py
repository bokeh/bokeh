"""This is the Bokeh charts interface. It gives you a high level API to build
complex plot is a simple way.

This is the Dot class which lets you build your Dot plots just passing
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

import operator
import pandas as pd
from ..builder import Builder, create_and_build
from ...models import FactorRange, Range1d
from ...models.renderers import GlyphRenderer
from ...models.annotations import BoxAnnotation, Span
from ..glyphs import BarGlyph, Segment
from ...core.properties import Float, Enum, Bool, Override
from ..properties import Dimension
from ..attributes import ColorAttr, CatAttr
from ..operations import Stack, Dodge
from ...core.enums import Aggregation
from ..stats import stats
from ..data_source import DataGroup
from ...models.sources import ColumnDataSource
from ..utils import help

from .bar_builder import BarBuilder
from ..glyphs import BarGlyph

#-----------------------------------------------------------------------------
# Classes and functions
#-----------------------------------------------------------------------------


def Waterfall(data, label=None, values=None, color=None, stack=None, group=None,
        agg="sum", xscale="categorical", yscale="linear", xgrid=False,
        ygrid=True, continuous_range=None, **kw):
    """ Create a Dot chart using
    :class:`DotBuilder <bokeh.charts.builders.dot_builder.DotBuilder>` to render the
    geometry from the inputs.

    Args:
        data (:ref:`userguide_charts_data_types`): the data
            source for the chart.
        label (list(str) or str, optional): list of string representing the categories.
            (Defaults to None)
        values (str, optional): iterable 2d representing the data series
            values matrix.
        color (str or list(str) or `~bokeh.charts._attributes.ColorAttr`): string color,
            string column name, list of string columns or a custom `ColorAttr`,
            which replaces the default `ColorAttr` for the builder.
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
        :class:`Chart`: includes glyph renderers that generate dots

    Examples:

        .. bokeh-plot::
            :source-position: above

            from bokeh.charts import Dot, output_file, show, hplot

            # best support is with data in a format that is table-like
            data = {
                'sample': ['1st', '2nd', '1st', '2nd', '1st', '2nd'],
                'interpreter': ['python', 'python', 'pypy', 'pypy', 'jython', 'jython'],
                'timing': [-2, 5, 12, 40, 22, 30]
            }

            # x-axis labels pulled from the interpreter column, stacking labels from sample column
            dot = Dot(data, values='timing', label='interpreter', stack='sample', agg='mean',
                      title="Python Interpreter Sampling", legend='top_right', width=400)

            # table-like data results in reconfiguration of the chart with no data manipulation
            dot2 = Dot(data, values='timing', label=['interpreter', 'sample'],
                       agg='mean', title="Python Interpreters", width=400)

            output_file("Dot.html")
            show(hplot(dot, dot2))

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

    # The continuous_range is the y_range (until we implement HDot charts)
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

    return create_and_build(WaterfallBuilder, data, **kw)


class WaterfallBuilder(BarBuilder):
    """Produces Dot Glyphs for groups of data.

    Handles dot plot options to produce one to many dots,
    which are used to describe the values of aggregated groups of data.

    """

    # ToDo: Support easier adding of one attr without reimplementation
    default_attributes = {'label': CatAttr(),
                          'color': ColorAttr(),
                          'line_color': ColorAttr(default='white'),
                          'stack': CatAttr(),
                          'group': CatAttr()}

    glyph = BarGlyph
    add_annotations = Bool(default=False)

    def yield_renderers(self):
        """Use the rect glyphs to display the bars.

        Takes reference points from data loaded at the ColumnDataSource.
        """
        kwargs = self.get_extra_args()
        attrs = self.collect_attr_kwargs()

        baseline = 0
        prev_cat = None

        additional_renderers = []

        self._temp_renderers = {}
        self._temp_categories_value = {}
        self._total = {}
        self._total_label = "total"
        self._total_color = "#2b8cbe"

        for i, group in enumerate(
            self._data.groupby(**self.attributes)):
            group_label = self._get_label(group['label'])
            self._temp_categories_value[group_label] = sum(group.data[self.values.selection].values)
            self._temp_renderers[group_label] = group

        baseline = 0
        prev_x = None
        for i, x in enumerate(self.get_sorted_x_range()):
            group = self._temp_renderers[x]

            glyph_kwargs = self.get_group_kwargs(group, attrs)
            group_kwargs = kwargs.copy()
            group_kwargs.update(glyph_kwargs)
            props = self.glyph.properties().difference(set(['label']))

            # make sure we always pass the color and line color
            for k in ['color', 'line_color']:
                group_kwargs[k] = group[k]

            # TODO(fpliger): we shouldn't need to do this to ensure we don't
            #               have extra kwargs... this is needed now because
            #               of label, group and stack being "special"
            for k in set(group_kwargs):
                if k not in props:
                    group_kwargs.pop(k)

            group_label = self._get_label(group['label'])

            bg = self.glyph(baseline=baseline,
                            label=group.label,
                            x_label=self._get_label(group['label']),
                            values=group.data[self.values.selection].values,
                            agg=stats[self.agg](),
                            width=self.bar_width,
                            fill_alpha=self.fill_alpha,
                            stack_label=self._get_label(group['stack']),
                            dodge_label=self._get_label(group['group']),
                            **group_kwargs)


            self._temp_renderers[group_label] = bg

            prev_cat = self._get_label(group['label'])

            self.add_glyph(group, bg)

            if prev_x and self.add_annotations:
                bg = self._temp_renderers[x]
                bg.source.data['__prev_cat'] = [prev_x]
                bg.source.data['__baseline'] = [baseline]
                bg.source.data['__annotation_line_width'] = [2]

                self._annotations.append(
                    Span(location=baseline, line_dash = 'dashdot')
                )

            baseline += self._temp_categories_value[group_label]

            prev_x = x

        Stack().apply(self.comp_glyphs)
        Dodge().apply(self.comp_glyphs)


        # a higher level function of bar chart is to keep track of max height of all bars
        self.max_height = max([renderer.y_max for renderer in self.comp_glyphs])
        self.min_height = min([renderer.y_min for renderer in self.comp_glyphs])


        # render total Bar
        group_kwargs = {'line_color': 'white', 'color': self._total_color}
        values = list(self._temp_categories_value.values())

        bg = self.glyph(baseline=0,
                        label={'value category': 'total', 'category': 'total'},
                        x_label=self._total_label,
                        values=values,
                        agg=stats["sum"](),
                        width=self.bar_width,
                        fill_alpha=self.fill_alpha,
                        stack_label=None,
                        dodge_label=None,
                        **group_kwargs)
        group = DataGroup(self._total_label, pd.DataFrame({"values": values}), {})
        self.add_glyph(group, bg)

        for renderer in self.comp_glyphs:
            for sub_renderer in renderer.renderers:
                yield sub_renderer


    def get_sorted_x_range(self):
        sorted_x = [x[0] for x in sorted(self._temp_categories_value.items(),
                            key=operator.itemgetter(1),
                            reverse=True)]

        return sorted_x

    def set_ranges(self):
        """Push the Bar data into the ColumnDataSource and calculate
        the proper ranges.
        """
        x_items = self.attributes['label'].items
        if x_items is None:
            x_items = ''
        x_labels = []

        # Items are identified by tuples. If the tuple has a single value,
        # we unpack it
        for item in x_items:
            item = self._get_label(item)

            x_labels.append(str(item))

        factors = self.get_sorted_x_range() + ['total']
        self.x_range = FactorRange(factors=factors)

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
