from __future__ import absolute_import

from collections import defaultdict
import numpy as np

from bokeh.properties import Float, String, Enum, Instance
from bokeh.enums import Aggregation
from bokeh.models.sources import ColumnDataSource
from bokeh.models.renderers import GlyphRenderer
from bokeh.models.glyphs import Rect

from ._models import CompositeGlyph
from .stats import Stat, Quantile, Sum, Min, Max


class AggregateGlyph(CompositeGlyph):
    """A base composite glyph for aggregating an array."""

    stack_label = String()
    stack_shift = Float(default=0.0)

    dodge_label = String()
    dodge_shift = Float(default=0.0)

    agg = Instance(Stat, default=Sum())

    span = Float()

    def __init__(self, **kwargs):
        super(AggregateGlyph, self).__init__(**kwargs)

    def get_dodge_label(self):
        return self.label + ':' + str(self.dodge_shift)

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

            for index, group in grouped.iteritems():
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
            for i, (index, group) in enumerate(grouped.iteritems()):
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

    def __init__(self, label, values, **kwargs):
        if not isinstance(label, str):
            label = str(label)

        kwargs['label'] = label
        kwargs['values'] = values

        super(Interval, self).__init__(**kwargs)

    def get_start(self):
        return self.start_agg.calculate(self.values)

    def get_end(self):
        return self.end_agg.calculate(self.values)

    def get_span(self):
        return self.end - self.start

    def build_source(self):
        # ToDo: Handle rotation
        self.start = self.get_start()
        self.end = self.get_end()
        self.span = self.get_span()

        width = [self.width]
        if self.dodge_shift > 0:
            x = [self.get_dodge_label()]
        else:
            x = [self.label]
        height = [self.span]
        y = [self.stack_shift + (self.span / 2.0) + self.start]
        color = [self.color]
        fill_alpha = [self.fill_alpha]
        return ColumnDataSource(dict(x=x, y=y, width=width, height=height, color=color, fill_alpha=fill_alpha))

    @property
    def x_max(self):
        return self.dodge_shift + (self.width / 2.0)

    @property
    def x_min(self):
        return self.dodge_shift - (self.width / 2.0)

    @property
    def y_max(self):
        return self.stack_shift + self.span + self.start

    @property
    def y_min(self):
        return self.stack_shift

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
    def __init__(self, label, values, interval1, interval2, **kwargs):
        kwargs['label'] = label
        kwargs['values'] = values
        kwargs['start_agg'] = Quantile(interval=interval1)
        kwargs['end_agg'] = Quantile(interval=interval2)
        super(QuartileGlyph, self).__init__(**kwargs)


class BoxGlyph(AggregateGlyph):
    """Summarizes the distribution with a collection of glyphs."""

    quartile2 = Instance(QuartileGlyph)
    quartile3 = Instance(QuartileGlyph)

    def __init__(self, label, values, outliers=False, **kwargs):
        width = kwargs.pop('width', None)

        kwargs['quartile2'] = QuartileGlyph(label=label, values=values, interval1=0.25, interval2=0.5, width=width)
        kwargs['quartile3'] = QuartileGlyph(label=label, values=values, interval1=0.5, interval2=0.75, width=width)
        super(BoxGlyph, self).__init__(**kwargs)

    def build_renderers(self):

        for comp_glyph in [self.quartile2, self.quartile3]:
            for renderer in comp_glyph.renderers:
                yield renderer

    def build_source(self):
        return None

    def _set_sources(self):
        pass

    def get_extent(self, func, prop_name):
        return func([getattr(renderer, prop_name) for renderer in [self.quartile2, self.quartile3]])

    @property
    def x_max(self):
        return self.get_extent(max, 'x_max')

    @property
    def x_min(self):
        return self.get_extent(min, 'x_min')

    @property
    def y_max(self):
        return self.get_extent(max, 'y_max')

    @property
    def y_min(self):
        return self.get_extent(min, 'y_min')


class Histogram(AggregateGlyph):
    """Estimates the distribution with rectangles through binning.

    Bins estimated with: https://en.wikipedia.org/wiki/Freedman%E2%80%93Diaconis_rule


    """
    def __init__(self, **kwargs):
        super(Histogram, self).__init__(**kwargs)
