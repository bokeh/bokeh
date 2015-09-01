from __future__ import absolute_import

from collections import defaultdict
import numpy as np

from bokeh.properties import Float, String, Enum
from bokeh.enums import Aggregation
from bokeh.models.sources import ColumnDataSource
from bokeh.models.renderers import GlyphRenderer
from bokeh.models.glyphs import Rect

from ._models import CompositeGlyph


class AggregateGlyph(CompositeGlyph):

    stack_label = String()
    stack_shift = Float(default=0.0)

    dodge_label = String()
    dodge_shift = Float(default=0.0)

    agg = Enum(Aggregation, default=None)

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

    def build_renderers(self):
        raise NotImplementedError('You must return list of renderers.')

    def build_source(self):
        raise NotImplementedError('You must return ColumnDataSource.')


class Interval(AggregateGlyph):
    """A rectangle representing aggregated values."""

    width = Float(default=0.8)
    start_agg = Enum(Aggregation, default=None)
    end_agg = Enum(Aggregation, default='sum')

    start = Float(default=0.0)
    end = Float()

    def __init__(self, label, values, **kwargs):
        if not isinstance(label, str):
            label = str(label)

        kwargs['label'] = label
        kwargs['values'] = values

        super(Interval, self).__init__(**kwargs)

    def get_start(self):
        return getattr(self.values, self.start_agg)()

    def get_end(self):
        return getattr(self.values, self.end_agg)()

    def __len__(self):
        return self.end - self.start

    def build_source(self):
        # ToDo: Handle rotation
        self.start = self.get_start()
        self.end = self.get_end()

        width = [self.width]
        if self.dodge_shift > 0:
            x = [self.get_dodge_label()]
        else:
            x = [self.label]
        height = [len(self)]
        y = [self.stack_shift + (len(self) / 2.0)]
        color = [self.color]
        fill_alpha = [self.fill_alpha]
        return ColumnDataSource(dict(x=x, y=y, width=width, height=height, color=color, fill_alpha=fill_alpha))

    def __stack__(self, glyphs):
        if self.stack_label is not None:
            filtered_glyphs = self.filter_glyphs(glyphs)
            grouped = self.groupby(filtered_glyphs, 'label')

            for index, group in grouped.iteritems():
                group = sorted(group, key=lambda x: x.stack_label)
                shift = []
                for i, bar in enumerate(group):
                    # save off the top of each rect's height
                    shift.append(len(bar))
                    if i > 0:
                        bar.stack_shift = sum(shift[0:i])
                        bar.refresh()

    def __dodge__(self, glyphs):
        if self.dodge_label is not None:
            filtered_glyphs = self.filter_glyphs(glyphs)
            grouped = self.groupby(filtered_glyphs, 'dodge_label')

            # calculate transformations
            step = np.linspace(0, 1.0, len(grouped.keys()) + 1, endpoint=False)
            width = min(0.2, (1. / len(grouped.keys())) ** 1.1)

            # set bar attributes and re-aggregate
            for i, (index, group) in enumerate(grouped.iteritems()):
                for bar in group:
                    bar.dodge_shift = step[i + 1]
                    bar.width = width
                    bar.refresh()

    @property
    def x_extent(self):
        return self.dodge_shift + (self.width / 2.0)

    @property
    def y_extent(self):
        return self.stack_shift + len(self)

    def build_renderers(self):
        glyph = Rect(x='x', y='y', width='width', height='height', fill_color='color', fill_alpha='fill_alpha')
        return [GlyphRenderer(glyph=glyph)]


class BarGlyph(Interval):

    def __init__(self, label, values, agg='sum', **kwargs):
        kwargs['end_agg'] = agg
        super(BarGlyph, self).__init__(label, values, **kwargs)

    def get_start(self):
        return 0.0
