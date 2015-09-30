from __future__ import absolute_import

from six import iteritems
from collections import defaultdict
import numpy as np

from bokeh.properties import (Float, String, Datetime, Bool, Instance,
                              List, Either, Int, Enum)
from bokeh.models.sources import ColumnDataSource
from bokeh.models.renderers import GlyphRenderer
from bokeh.models.glyphs import Rect, Segment, Line
from bokeh.enums import DashPattern

from ._models import CompositeGlyph
from ._properties import Column, EitherColumn
from bokeh.charts import DEFAULT_PALETTE
from .utils import marker_types
from .stats import Stat, Quantile, Sum, Min, Max, Bins


class NestedCompositeGlyph(CompositeGlyph):
    """A composite glyph that consists of other composite glyphs."""

    children = List(Instance(CompositeGlyph))

    @property
    def y_max(self):
        return max([renderer.y_max for renderer in self.children])

    @property
    def y_min(self):
        return min([renderer.y_min for renderer in self.children])

    @property
    def x_min(self):
        return min([renderer.x_min for renderer in self.children])

    @property
    def x_max(self):
        return max([renderer.x_max for renderer in self.children])


class XyGlyph(CompositeGlyph):
    """Composite glyph that plots in cartesian coordinates."""
    x = EitherColumn(String, Column(Float), Column(String), Column(Datetime), Column(Bool))
    y = EitherColumn(String, Column(Float), Column(String), Column(Datetime), Column(Bool))
    line_color = String(default=DEFAULT_PALETTE[0])
    line_alpha = Float(default=1.0)

    def build_source(self):
        if self.x is None:
            x = [self.label] * len(self.y)
            data = dict(x_values=x, y_values=self.y)
        elif self.y is None:
            y = [self.label] * len(self.x)
            data = dict(x_values=self.x, y_values=y)
        else:
            data = dict(x_values=self.x, y_values=self.y)
        return ColumnDataSource(data)

    @property
    def x_max(self):
        return max(self.source._data['x_values'])

    @property
    def x_min(self):
        return min(self.source._data['x_values'])

    @property
    def y_max(self):
        return max(self.source._data['y_values'])

    @property
    def y_min(self):
        return min(self.source._data['y_values'])


class PointGlyph(XyGlyph):
    """A set of glyphs placed in x,y coordinates with the same attributes."""

    fill_color = String(default=DEFAULT_PALETTE[1])
    fill_alpha = Float(default=0.7)
    marker = String(default='circle')
    size = Float(default=8)

    def __init__(self, x=None, y=None, line_color=None, fill_color=None,
                 marker=None, size=None, **kwargs):
        kwargs['x'] = x
        kwargs['y'] = y
        kwargs['line_color'] = line_color or self.line_color
        kwargs['fill_color'] = fill_color or self.fill_color
        kwargs['marker'] = marker or self.marker
        kwargs['size'] = size or self.size
        super(PointGlyph, self).__init__(**kwargs)

    def get_glyph(self):
        return marker_types[self.marker]

    def build_renderers(self):
        glyph_type = self.get_glyph()
        glyph = glyph_type(x='x_values', y='y_values',
                           line_color=self.line_color,
                           fill_color=self.fill_color,
                           size=self.size,
                           fill_alpha=self.fill_alpha,
                           line_alpha=self.line_alpha)
        yield GlyphRenderer(glyph=glyph)


class LineGlyph(XyGlyph):
    """Represents a group of data as a line."""

    width = Int(default=2)
    dash = Enum(DashPattern, default='solid')

    def __init__(self, x=None, y=None, line_color=None,
                 width=None, dash=None, **kwargs):
        kwargs['x'] = x
        kwargs['y'] = y
        kwargs['line_color'] = line_color or self.line_color
        kwargs['width'] = width or self.width
        kwargs['dash'] = dash or self.dash
        super(LineGlyph, self).__init__(**kwargs)

    def build_source(self):
        if self.x is None:
            x = self.y.index
            data = dict(x_values=x, y_values=self.y)
        elif self.y is None:
            y = self.x.index
            data = dict(x_values=self.x, y_values=y)
        else:
            data = dict(x_values=self.x, y_values=self.y)
        return ColumnDataSource(data)

    def build_renderers(self):
        glyph = Line(x='x_values', y='y_values',
                     line_color=self.line_color,
                     line_alpha=self.line_alpha,
                     line_width=self.width,
                     line_dash=self.dash)
        yield GlyphRenderer(glyph=glyph)


class AggregateGlyph(NestedCompositeGlyph):
    """A base composite glyph for aggregating an array.

    Implements default stacking and dodging behavior that other composite
    glyphs can inherit.
    """

    stack_label = String()
    stack_shift = Float(default=0.0)

    dodge_label = String()
    dodge_shift = Float(default=None)

    agg = Instance(Stat, default=Sum())

    span = Float()

    def get_dodge_label(self, shift=0.0):
        if self.dodge_shift is None:
            shift_str = ':' + str(0.5 + shift)
        elif self.dodge_shift is not None:
            shift_str = ':' + str(self.dodge_shift + shift)
        else:
            shift_str = ''
        return str(self.label) + shift_str

    def filter_glyphs(self, glyphs):
        return [glyph for glyph in glyphs if isinstance(glyph, self.__class__)]

    @staticmethod
    def groupby(glyphs, prop):
        grouped = defaultdict(list)
        [grouped[getattr(glyph, prop)].append(glyph) for glyph in glyphs]
        return grouped

    def __stack__(self, glyphs):
        if self.stack_label is not None:
            filtered_glyphs = self.filter_glyphs(glyphs)
            grouped = self.groupby(filtered_glyphs, 'label')

            for index, group in iteritems(grouped):
                group = sorted(group, key=lambda x: x.stack_label)
                shift = []
                for i, glyph in enumerate(group):
                    # save off the top of each rect's height
                    shift.append(glyph.span)
                    if i > 0:
                        glyph.stack_shift = sum(shift[0:i])
                        glyph.refresh()

    def __dodge__(self, glyphs):
        if self.dodge_label is not None:
            filtered_glyphs = self.filter_glyphs(glyphs)
            grouped = self.groupby(filtered_glyphs, 'dodge_label')

            # calculate transformations
            step = np.linspace(0, 1.0, len(grouped.keys()) + 1, endpoint=False)
            width = min(0.2, (1. / len(grouped.keys())) ** 1.1)

            # set bar attributes and re-aggregate
            for i, (index, group) in enumerate(iteritems(grouped)):
                for glyph in group:
                    glyph.dodge_shift = step[i + 1]
                    glyph.width = width
                    glyph.refresh()


class Interval(AggregateGlyph):
    """A rectangle representing aggregated values.

    The interval is a rect glyph where two of the parallel
    sides represent a summary of values. Each of the two sides
    is derived from a separate aggregation of the values
    provided to the interval.

    Note: A bar is a special case interval where one side
    is pinned and used to communicate a value relative to
    it.
    """

    width = Float(default=0.8)
    start_agg = Instance(Stat, default=Min())
    end_agg = Instance(Stat, default=Max())

    start = Float(default=0.0)
    end = Float()

    label_value = Either(String, Float, Datetime, Bool, default=None)

    def __init__(self, label, values, **kwargs):
        if not isinstance(label, str):
            label_value = label
            label = str(label)
        else:
            label_value = None

        kwargs['label'] = label
        kwargs['label_value'] = label_value
        kwargs['values'] = values

        super(Interval, self).__init__(**kwargs)

    def get_start(self):
        self.start_agg.set_data(self.values)
        return self.start_agg.value

    def get_end(self):
        self.end_agg.set_data(self.values)
        return self.end_agg.value

    def get_span(self):
        return self.end - self.start

    def build_source(self):
        # ToDo: Handle rotation
        self.start = self.get_start()
        self.end = self.get_end()
        self.span = self.get_span()

        width = [self.width]
        if self.dodge_shift is not None:
            x = [self.get_dodge_label()]
        else:
            x = [self.label_value or self.label]
        height = [self.span]
        y = [self.stack_shift + (self.span / 2.0) + self.start]
        color = [self.color]
        fill_alpha = [self.fill_alpha]
        return ColumnDataSource(dict(x=x, y=y, width=width, height=height, color=color, fill_alpha=fill_alpha))

    @property
    def x_max(self):
        return (self.dodge_shift or self.label_value) + (self.width / 2.0)

    @property
    def x_min(self):
        return (self.dodge_shift or self.label_value) - (self.width / 2.0)

    @property
    def y_max(self):
        return self.stack_shift + self.span + self.start

    @property
    def y_min(self):
        return self.stack_shift + self.start

    def build_renderers(self):
        glyph = Rect(x='x', y='y', width='width', height='height', fill_color='color', fill_alpha='fill_alpha')
        yield GlyphRenderer(glyph=glyph)


class BarGlyph(Interval):
    """Special case of Interval where the span represents a value.

    A bar always begins from 0, or the value that is being compared to.
    """

    def __init__(self, label, values, agg='sum', **kwargs):
        kwargs['end_agg'] = agg
        super(BarGlyph, self).__init__(label, values, **kwargs)

    def get_start(self):
        return 0.0


class QuartileGlyph(Interval):
    """An interval that has start and end aggregations of quartiles."""
    def __init__(self, label, values, interval1, interval2, **kwargs):
        kwargs['label'] = label
        kwargs['values'] = values
        kwargs['start_agg'] = Quantile(interval=interval1)
        kwargs['end_agg'] = Quantile(interval=interval2)
        super(QuartileGlyph, self).__init__(**kwargs)


class BoxGlyph(AggregateGlyph):
    """Summarizes the distribution with a collection of glyphs.

    A box glyph produces one "box" for a given array of vales. The box
    is made up of multiple other child composite glyphs (intervals,
    scatter) and directly produces glyph renderers for the whiskers,
    as well.
    """

    q1 = Float()
    q2 = Float()
    q3 = Float()
    iqr = Float()

    w0 = Float(help='Lower whisker')
    w1 = Float(help='Upper whisker')

    q2_glyph = Instance(QuartileGlyph)
    q3_glyph = Instance(QuartileGlyph)

    whisker_glyph = Instance(GlyphRenderer)

    outliers = Either(Bool, Instance(PointGlyph))

    marker = String(default='circle')
    whisker_width = Float(default=0.3)
    whisker_line_width = Float(default=2)
    whisker_span_line_width = Float(default=2)
    whisker_color = String(default='black')

    outlier_fill_color = String(default='red')
    outlier_line_color = String(default='red')
    outlier_size = Float(default=5)

    bar_color = String(default='DimGrey')

    def __init__(self, label, values, outliers=True, **kwargs):
        width = kwargs.pop('width', None)

        bar_color = kwargs.pop('color', None) or self.bar_color

        kwargs['outliers'] = kwargs.pop('outliers', None) or outliers
        kwargs['label'] = label
        kwargs['values'] = values
        kwargs['q2_glyph'] = QuartileGlyph(label=label, values=values, interval1=0.25,
                                           interval2=0.5, width=width, color=bar_color)
        kwargs['q3_glyph'] = QuartileGlyph(label=label, values=values, interval1=0.5,
                                           interval2=0.75, width=width, color=bar_color)
        super(BoxGlyph, self).__init__(**kwargs)

    def build_renderers(self):

        self.calc_quartiles()
        outlier_values = self.values[((self.values < self.w0) | (self.values > self.w1))]

        self.whisker_glyph = GlyphRenderer(glyph=Segment(x0='x0s', y0='y0s', x1='x1s', y1='y1s',
                                           line_width=self.whisker_line_width,
                                           line_color=self.whisker_color))

        if len(outlier_values) > 0 and self.outliers:
            self.outliers = PointGlyph(y=outlier_values, label=self.get_dodge_label(),
                                       line_color=self.outlier_line_color,
                                       fill_color=self.outlier_fill_color,
                                       size=self.outlier_size, marker=self.marker)

        for comp_glyph in self.composite_glyphs:
            for renderer in comp_glyph.renderers:
                yield renderer

        yield self.whisker_glyph

    def calc_quartiles(self):
        self.q1 = self.q2_glyph.start
        self.q2 = self.q2_glyph.end
        self.q3 = self.q3_glyph.end
        self.iqr = self.q3 - self.q1
        self.w0 = self.q1 - (1.5 * self.iqr)
        self.w1 = self.q3 + (1.5 * self.iqr)

    def build_source(self):
        self.calc_quartiles()
        x_label = self.get_dodge_label()
        x_w0_label = self.get_dodge_label(shift=(self.whisker_width / 2.0))
        x_w1_label = self.get_dodge_label(shift=-(self.whisker_width / 2.0))

        # span0, whisker bar0, span1, whisker bar1
        x0s = [x_label, x_w0_label, x_label, x_w0_label]
        y0s = [self.w0, self.w0, self.q3, self.w1]
        x1s = [x_label, x_w1_label, x_label, x_w1_label]
        y1s = [self.q1, self.w0, self.w1, self.w1]

        return ColumnDataSource(dict(x0s=x0s, y0s=y0s, x1s=x1s, y1s=y1s))

    def _set_sources(self):
        self.whisker_glyph.data_source = self.source

    def get_extent(self, func, prop_name):
        return func([getattr(renderer, prop_name) for renderer in self.composite_glyphs])

    @property
    def composite_glyphs(self):
        comp_glyphs = [self.q2_glyph, self.q3_glyph]
        if isinstance(self.outliers, PointGlyph):
            comp_glyphs.append(self.outliers)
        return comp_glyphs

    @property
    def x_max(self):
        return self.get_extent(max, 'x_max') + self.right_buffer

    @property
    def x_min(self):
        return self.get_extent(min, 'x_min') - self.left_buffer

    @property
    def y_max(self):
        return max(self.w1, self.get_extent(max, 'y_max')) + self.top_buffer

    @property
    def y_min(self):
        return min(self.w0, self.get_extent(min, 'y_min')) - self.bottom_buffer


class HistogramGlyph(AggregateGlyph):
    """Depicts the distribution of values using rectangles created by binning.

    The histogram represents a distribution, so will likely include other
    options for displaying it, such as KDE and cumulative density.
    """

    bins = Instance(Bins)
    bin_count = Float()

    bars = List(Instance(BarGlyph))

    centers = List(Float)

    bin_width = Float()

    def __init__(self, values, label=None, color=None, bin_count=None, **kwargs):
        if label is not None:
            kwargs['label'] = label
        kwargs['values'] = values
        kwargs['bin_count'] = bin_count
        kwargs['color'] = color or self.color

        # remove width, since this is handled automatically
        kwargs.pop('width', None)

        super(HistogramGlyph, self).__init__(**kwargs)

    def _set_sources(self):
        pass

    def build_source(self):
        pass

    def build_renderers(self):
        self.bins = Bins(values=self.values, bin_count=self.bin_count)
        self.centers = [bin.center for bin in self.bins.bins]
        self.bin_width = self.centers[1] - self.centers[0]

        bars = []
        for bin in self.bins.bins:
            bars.append(BarGlyph(label=bin.center, values=bin.values, color=self.color,
                                 fill_alpha=self.fill_alpha, agg=bin.stat, width=self.bin_width))

        self.bars = bars
        self.children = self.bars

        for comp_glyph in self.bars:
            for renderer in comp_glyph.renderers:
                yield renderer

    @property
    def y_min(self):
        return 0.0
