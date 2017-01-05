'''

'''
from __future__ import absolute_import, division

from collections import defaultdict

import numpy as np
import pandas as pd

from bokeh.charts import DEFAULT_PALETTE
from bokeh.core.enums import DashPattern
from bokeh.models.glyphs import Arc, Line, Patches, Rect, Segment
from bokeh.models.renderers import GlyphRenderer
from bokeh.core.properties import Any, Angle, Bool, Color, Datetime, Either, Enum, Float, List, Override, Instance, Int, String

from .data_source import ChartDataSource
from .models import CompositeGlyph
from .properties import Column, EitherColumn
from .stats import BinnedStat, Bins, Histogram, Max, Min, Quantile, Stat, stats, Sum
from .utils import generate_patch_base, label_from_index_dict, marker_types

class NestedCompositeGlyph(CompositeGlyph):
    """A composite glyph that consists of other composite glyphs.

    An important responsibility of any `CompositeGlyph` is to understand the bounds
    of the glyph renderers that make it up. This class is used to provide convenient
    properties that return the bounds from the child `CompositeGlyphs`.
    """

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

    def build_source(self):
        labels = self._build_label_array(('x', 'y'), self.label)
        str_labels = [str(label) for label in labels]

        if self.x is None:
            data = dict(x_values=str_labels, y_values=self.y)
        elif self.y is None:
            data = dict(x_values=self.x, y_values=str_labels)
        else:
            data = dict(x_values=self.x, y_values=self.y)

        return data

    def _build_label_array(self, props, value):
        for prop in props:
            if getattr(self, prop) is not None:
                return [value] * len(getattr(self, prop))

    @property
    def x_max(self):
        # TODO(fpliger): since CompositeGlyphs are not exposed in general we
        #                should expect to always have a Series but in case
        #                it's not we just use the default min/max instead
        #                of just failing. When/If we end up exposing
        #                CompositeGlyphs we should consider making this
        #                more robust (either enforcing data or checking)
        try:
            return self.source.data['x_values'].max()
        except AttributeError:
            return max(self.source.data['x_values'])

    @property
    def x_min(self):
        try:
            return self.source.data['x_values'].min()
        except AttributeError:
            return min(self.source.data['x_values'])

    @property
    def y_max(self):
        try:
            return self.source.data['y_values'].max()
        except AttributeError:
            return max(self.source.data['y_values'])

    @property
    def y_min(self):
        try:
            return self.source.data['y_values'].min()
        except AttributeError:
            return min(self.source.data['y_values'])


class PointGlyph(XyGlyph):
    """A set of glyphs placed in x,y coordinates with the same attributes."""

    fill_color = Override(default=DEFAULT_PALETTE[1])
    fill_alpha = Override(default=0.7)
    marker = String(default='circle')
    size = Float(default=8)

    def __init__(self, x=None, y=None, color=None, line_color=None, fill_color=None,
                 marker=None, size=None, **kwargs):
        kwargs['x'] = x
        kwargs['y'] = y
        if marker is not None: kwargs['marker'] = marker
        if size is not None: kwargs['size'] = size

        if color:
            line_color = color
            fill_color = color

        kwargs['line_color'] = line_color
        kwargs['fill_color'] = fill_color

        super(PointGlyph, self).__init__(**kwargs)
        self.setup()

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

    def __init__(self, x=None, y=None, color=None, line_color=None,
                 width=None, dash=None, **kwargs):
        kwargs['x'] = x
        kwargs['y'] = y

        if color is not None and line_color is None:
            line_color = color

        if dash is not None:
            kwargs['dash'] = dash

        if width is not None:
            kwargs['width'] = width

        if line_color is not None:
            kwargs['line_color'] = line_color

        super(LineGlyph, self).__init__(**kwargs)
        self.setup()

    def build_source(self):
        if self.x is None:
            x = self.y.index
            data = dict(x_values=x, y_values=self.y)
        elif self.y is None:
            y = self.x.index
            data = dict(x_values=self.x, y_values=y)
        else:
            data = dict(x_values=self.x, y_values=self.y)

        return data

    def build_renderers(self):
        """Yield a `GlyphRenderer` for the group of data."""
        glyph = Line(x='x_values', y='y_values',
                     line_color=self.line_color,
                     line_alpha=self.line_alpha,
                     line_width=self.width,
                     line_dash=self.dash)
        yield GlyphRenderer(glyph=glyph)


class AreaGlyph(LineGlyph):

    # ToDo: should these be added to composite glyph?
    stack = Bool(default=False)
    dodge = Bool(default=False)

    base = Float(default=0.0, help="""Lower bound of area.""")

    def __init__(self, **kwargs):
        line_color = kwargs.get('line_color')
        fill_color = kwargs.get('fill_color')
        color = kwargs.get('color')

        if color is not None:
            # apply color to line and fill
            kwargs['fill_color'] = color
            kwargs['line_color'] = color
        elif line_color is not None and fill_color is None:
            # apply line color to fill color by default
            kwargs['fill_color'] = line_color

        super(AreaGlyph, self).__init__(**kwargs)
        self.setup()

    def build_source(self):
        data = super(AreaGlyph, self).build_source()

        x0, y0 = generate_patch_base(pd.Series(list(data['x_values'])),
                                     pd.Series(list(data['y_values'])))

        data['x_values'] = [x0]
        data['y_values'] = [y0]

        return data

    def build_renderers(self):

        # parse all series. We exclude the first attr as it's the x values
        # added for the index
        glyph = Patches(
            xs='x_values', ys='y_values',
            fill_alpha=self.fill_alpha, fill_color=self.fill_color,
            line_color=self.line_color
        )
        renderer = GlyphRenderer(data_source=self.source, glyph=glyph)
        yield renderer

    def __stack__(self, glyphs):

        # ToDo: need to handle case of non-aligned indices, see pandas concat
        # ToDo: need to address how to aggregate on an index when required

        # build a list of series
        areas = []
        for glyph in glyphs:
            areas.append(pd.Series(glyph.source.data['y_values'][0],
                                   index=glyph.source.data['x_values'][0]))

        # concat the list of indexed y values into dataframe
        df = pd.concat(areas, axis=1)

        # calculate stacked values along the rows
        stacked_df = df.cumsum(axis=1)

        # lower bounds of each area series are diff between stacked and orig values
        lower_bounds = stacked_df - df

        # reverse the df so the patch is drawn in correct order
        lower_bounds = lower_bounds.iloc[::-1]

        # concat the upper and lower bounds together
        stacked_df = pd.concat([stacked_df, lower_bounds])

        # update the data in the glyphs
        for i, glyph in enumerate(glyphs):
            glyph.source.data['x_values'] = [stacked_df.index.values]
            glyph.source.data['y_values'] = [stacked_df.ix[:, i].values]

    def get_nested_extent(self, col, func):
        return [getattr(arr, func)() for arr in self.source.data[col]]

    @property
    def x_max(self):
        return max(self.get_nested_extent('x_values', 'max'))

    @property
    def x_min(self):
        return min(self.get_nested_extent('x_values', 'min'))

    @property
    def y_max(self):
        return max(self.get_nested_extent('y_values', 'max'))

    @property
    def y_min(self):
        return min(self.get_nested_extent('y_values', 'min'))


class HorizonGlyph(AreaGlyph):
    num_folds = Int(default=3, help="""The count of times the data is overlapped.""")

    series = Int(default=0, help="""The id of the series as the order it will appear,
    starting from 0.""")

    series_count = Int()

    fold_height = Float(help="""The height of one fold.""")

    bins = List(Float, help="""The binedges calculated from the number of folds,
    and the maximum value of the entire source data.""")

    graph_ratio = Float(help="""Scales heights of each series based on number of folds
    and the number of total series being plotted.
    """)

    pos_color = Color("#006400", help="""The color used for positive values.""")
    neg_color = Color("#6495ed", help="""The color used for negative values.""")

    flip_neg = Bool(default=True, help="""When True, the negative values will be
    plotted as their absolute value, then their individual axes is flipped. If False,
    then the negative values will still be taken as their absolute value, but the base
    of their shape will start from the same origin as the positive values.
    """)

    def __init__(self, bins=None, **kwargs):

        # fill alpha depends on how many folds will be layered
        kwargs['fill_alpha'] = 1.0/kwargs['num_folds']

        if bins is not None:
            kwargs['bins'] = bins

            # each series is shifted up to a synthetic y-axis
            kwargs['base'] = kwargs['series'] * max(bins) / kwargs['series_count']
            kwargs['graph_ratio'] = float(kwargs['num_folds'])/float(kwargs['series_count'])

        super(HorizonGlyph, self).__init__(**kwargs)

    def build_source(self):
        data = {}

        # Build columns for the positive values
        pos_y = self.y.copy()
        pos_y[pos_y < 0] = 0
        xs, ys = self._build_dims(self.x, pos_y)

        # list of positive colors and alphas
        colors = [self.pos_color] * len(ys)
        alphas = [(bin_idx * self.fill_alpha) for bin_idx in
                  range(0, len(self.bins))]

        # If we have negative values at all, add the values for those as well
        if self.y.min() < 0:
            neg_y = self.y.copy()
            neg_y[neg_y > 0] = 0
            neg_y = abs(neg_y)
            neg_xs, neg_ys = self._build_dims(self.x, neg_y, self.flip_neg)

            xs += neg_xs
            ys += neg_ys
            colors += ([self.neg_color] * len(neg_ys))
            alphas += alphas

        # create clipped representation of each band
        data['x_values'] = xs
        data['y_values'] = ys
        data['fill_color'] = colors
        data['fill_alpha'] = colors
        data['line_color'] = colors

        return data

    def _build_dims(self, x, y, flip=False):
        """ Creates values needed to plot each fold of the horizon glyph.

        Bins the data based on the binning passed into the glyph, then copies and clips
        the values for each bin.

        Args:
            x (`pandas.Series`): array of x values
            y (`pandas.Series`): array of y values
            flip (bool): whether to flip values, used when handling negative values

        Returns:
            tuple(list(`numpy.ndarray`), list(`numpy.ndarray`)): returns a list of
                arrays for the x values and list of arrays for the y values. The data
                has been folded and transformed so the patches glyph presents the data
                in a way that looks like an area chart.
        """

        # assign bins to each y value
        bin_idx = pd.cut(y, bins=self.bins, labels=False, include_lowest=True)

        xs, ys = [], []
        for idx, bin in enumerate(self.bins[0:-1]):

            # subtract off values associated with lower bins, to get into this bin
            temp_vals = y.copy() - (idx * self.fold_height)

            # clip the values between the fold range and zero
            temp_vals[bin_idx > idx] = self.fold_height * self.graph_ratio
            temp_vals[bin_idx < idx] = 0
            temp_vals[bin_idx == idx] = self.graph_ratio * temp_vals[bin_idx == idx]

            # if flipping, we must start the values from the top of each fold's range
            if flip:
                temp_vals = (self.fold_height * self.graph_ratio) - temp_vals
                base = self.base + (self.fold_height * self.graph_ratio)
            else:
                base = self.base

            # shift values up based on index of series
            temp_vals += self.base
            val_idx = temp_vals > 0
            if pd.Series.any(val_idx):
                ys.append(temp_vals)
                xs.append(x)

        # transform clipped data so it always starts and ends at its base value
        if len(ys) > 0:
            xs, ys = map(list, zip(*[generate_patch_base(xx, yy, base=base) for
                                     xx, yy in zip(xs, ys)]))

        return xs, ys

    def build_renderers(self):
        # parse all series. We exclude the first attr as it's the x values
        # added for the index
        glyph = Patches(
            xs='x_values', ys='y_values',
            fill_alpha=self.fill_alpha, fill_color='fill_color',
            line_color='line_color'
        )
        renderer = GlyphRenderer(data_source=self.source, glyph=glyph)
        yield renderer


class StepGlyph(LineGlyph):
    """Represents a group of data as a stepped line."""

    def build_source(self):
        x = self.x
        y = self.y
        if self.x is None:
            x = self.y.index
        elif self.y is None:
            y = self.x.index

        dtype = x.dtype if hasattr(x, 'dtype') else np.int
        xs = np.empty(2*len(x)-1, dtype=dtype)
        xs[::2] = x[:]
        xs[1::2] = x[1:]

        dtype = y.dtype if hasattr(y, 'dtype') else np.float64
        ys = np.empty(2*len(y)-1, dtype=dtype)
        ys[::2] = y[:]
        ys[1::2] = y[:-1]

        data = dict(x_values=xs, y_values=ys)
        return data


class AggregateGlyph(NestedCompositeGlyph):
    """A base composite glyph for aggregating an array.

    Implements default stacking and dodging behavior that other composite
    glyphs can inherit.
    """

    x_label = String()
    x_label_value = Any()

    stack_label = String()
    stack_shift = Float(default=0.0)

    dodge_label = String(help="""Where on the scale the glyph should be placed.""")
    dodge_shift = Float(default=None)

    agg = Instance(Stat, default=Sum())

    span = Float(help="""The range of values represented by the aggregate.""")

    def __init__(self, x_label=None, **kwargs):

        label = kwargs.get('label')
        if x_label is not None:
            kwargs['x_label_value'] = x_label

            if not isinstance(x_label, str):
                x_label = str(x_label)

            kwargs['x_label'] = x_label
        elif label is not None:
            kwargs['x_label'] = str(label)

        super(AggregateGlyph, self).__init__(**kwargs)

    def get_dodge_label(self, shift=0.0):
        """Generate the label defining an offset in relation to a position on a scale."""
        if self.dodge_shift is None:
            shift_str = ':' + str(0.5 + shift)
        elif self.dodge_shift is not None:
            shift_str = ':' + str(self.dodge_shift + shift)
        else:
            shift_str = ''

        return str(label_from_index_dict(self.x_label)) + shift_str

    def filter_glyphs(self, glyphs):
        """Return only the glyphs that are of the same class."""
        return [glyph for glyph in glyphs if isinstance(glyph, self.__class__)]

    @staticmethod
    def groupby(glyphs, prop):
        """Returns a dict of `CompositeGlyph`s, grouped by unique values of prop.

        For example, if all glyphs had a value of 'a' or 'b' for glyph.prop, the dict
        would contain two keys, 'a' and 'b', where each value is a list of the glyphs
        that had each of the values.
        """
        grouped = defaultdict(list)
        labels = [getattr(glyph, prop) for glyph in glyphs]
        labels = [tuple(label.values()) if isinstance(label, dict) else label for label
                  in labels]
        [grouped[label].append(glyph) for label, glyph in zip(labels, glyphs)]
        labels = pd.Series(labels).drop_duplicates().values
        return labels, grouped

    def __stack__(self, glyphs):
        """Apply relative shifts to the composite glyphs for stacking."""
        filtered_glyphs = self.filter_glyphs(glyphs)
        labels, grouped = self.groupby(filtered_glyphs, 'x_label')

        for label in labels:
            group = grouped[label]

            # separate the negative and positive aggregates into separate groups
            neg_group = [glyph for glyph in group if glyph.span < 0]
            pos_group = [glyph for glyph in group if glyph.span >= 0]

            # apply stacking to each group separately
            for group in [neg_group, pos_group]:
                shift = []
                for i, glyph in enumerate(group):
                    # save off the top of each rect's height
                    shift.append(glyph.span)
                    if i > 0:
                        glyph.stack_shift = sum(shift[0:i])
                        glyph.refresh()

    def __dodge__(self, glyphs):
        """Apply relative shifts to the composite glyphs for dodging."""
        if self.dodge_label is not None:
            filtered_glyphs = self.filter_glyphs(glyphs)
            labels, grouped = self.groupby(filtered_glyphs, 'dodge_label')

            # calculate transformations
            step = np.linspace(0, 1.0, len(grouped.keys()) + 1, endpoint=False)
            width = min(0.2, (1. / len(grouped.keys())) ** 1.1)

            # set bar attributes and re-aggregate
            for i, label in enumerate(labels):
                group = grouped[label]
                for glyph in group:
                    glyph.dodge_shift = step[i + 1]
                    glyph.width = width
                    glyph.refresh()


class Interval(AggregateGlyph):
    """A rectangle representing aggregated values.

    The interval is a rect glyph where two of the parallel sides represent a
    summary of values. Each of the two sides is derived from a separate aggregation of
    the values provided to the interval.

    .. note::
        A bar is a special case interval where one side is pinned and used to
        communicate a value relative to it.
    """

    width = Float(default=0.8)
    start_agg = Either(Instance(Stat), Enum(*list(stats.keys())), default=Min(), help="""
        The stat used to derive the starting point of the composite glyph.""")
    end_agg = Either(Instance(Stat), Enum(*list(stats.keys())), default=Max(), help="""
        The stat used to derive the end point of the composite glyph.""")

    start = Float(default=0.0)
    end = Float()

    def __init__(self, label, values, **kwargs):

        kwargs['label'] = label
        kwargs['values'] = values

        super(Interval, self).__init__(**kwargs)
        self.setup()

    def get_start(self):
        """Get the value for the start of the glyph."""
        if len(self.values.index) == 1:
            self.start_agg = None
            return self.values[0]
        elif isinstance(self.start_agg, str):
            self.start_agg = stats[self.start_agg]()

        self.start_agg.set_data(self.values)
        return self.start_agg.value

    def get_end(self):
        """Get the value for the end of the glyph."""
        if isinstance(self.end_agg, str):
            self.end_agg = stats[self.end_agg]()

        self.end_agg.set_data(self.values)
        return self.end_agg.value

    def get_span(self):
        """The total range between the start and end."""
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
            x = [self.x_label]
        height = [self.span]
        y = [self.stack_shift + (self.span / 2.0) + self.start]
        color = [self.color]
        fill_alpha = [self.fill_alpha]
        line_color = [self.line_color]
        line_alpha = [self.line_alpha]
        label = [self.label]

        return dict(x=x, y=y, width=width, height=height, color=color,
                    fill_alpha=fill_alpha, line_color=line_color,
                    line_alpha=line_alpha, label=label)

    @property
    def x_max(self):
        """The maximum extent of the glyph in x.

        .. note::
            Dodging the glyph can affect the value.
        """
        return (self.dodge_shift or self.x_label_value) + (self.width / 2.0)

    @property
    def x_min(self):
        """The maximum extent of the glyph in y.

        .. note::
            Dodging the glyph can affect the value.
        """
        return (self.dodge_shift or self.x_label_value) - (self.width / 2.0)

    @property
    def y_max(self):
        """Maximum extent of all `Glyph`s.

        How much we are stacking + the height of the interval + the base of the interval

        .. note::
            the start and end of the glyph can swap between being associated with the
            min and max when the glyph end represents a negative value.
        """
        return max(self.bottom, self.top)

    @property
    def y_min(self):
        """The minimum extent of all `Glyph`s in y.

        .. note::
            the start and end of the glyph can swap between being associated with the
            min and max when the glyph end represents a negative value.
        """
        return min(self.bottom, self.top)

    @property
    def bottom(self):
        """The value associated with the start of the stacked glyph."""
        return self.stack_shift + self.start

    @property
    def top(self):
        """The value associated with the end of the stacked glyph."""
        return self.stack_shift + self.span + self.start

    def build_renderers(self):
        """Yields a `GlyphRenderer` associated with a `Rect` glyph."""
        glyph = Rect(x='x', y='y', width='width', height='height', fill_color='color',
                     fill_alpha='fill_alpha', line_color='line_color')
        yield GlyphRenderer(glyph=glyph)


class BarGlyph(Interval):
    """Special case of Interval where the span represents a value.

    A bar always begins from 0, or the value that is being compared to, and
    extends to some positive or negative value.
    """

    def __init__(self, label, values, agg='sum', **kwargs):
        kwargs['end_agg'] = agg
        kwargs['start_agg'] = None
        super(BarGlyph, self).__init__(label, values, **kwargs)
        self.setup()

    def get_start(self):
        return 0.0


class DotGlyph(Interval):
    """Special case of Interval where the span represents a value.

    A bar always begins from 0, or the value that is being compared to, and
    extends to some positive or negative value.
    """

    marker = String(default='circle')
    size = Float(default=8)
    stem = Bool(False, help="""
    Whether to draw a stem from each do to the axis.
    """)
    stem_line_width = Float(default=1)
    stem_color = String(default='black')

    def __init__(self, label, values, agg='sum', **kwargs):
        kwargs['end_agg'] = agg
        super(DotGlyph, self).__init__(label, values, **kwargs)
        self.setup()

    def get_start(self):
        return 0.0

    def get_glyph(self):
        return marker_types[self.marker]

    def build_renderers(self):
        if self.stem:
            yield GlyphRenderer(glyph=Segment(
                x0='x', y0=0, x1='x', y1='height',
                line_width=self.stem_line_width,
                line_color=self.stem_color,
                line_alpha='fill_alpha')
            )

        glyph_type = self.get_glyph()
        glyph = glyph_type(x='x', y='height',
                           line_color=self.line_color,
                           fill_color=self.color,
                           size=self.size,
                           fill_alpha='fill_alpha',
                           line_alpha='line_alpha'
                           )
        yield GlyphRenderer(glyph=glyph)


class QuartileGlyph(Interval):
    """An interval that has start and end aggregations of quartiles."""
    def __init__(self, label, values, interval1, interval2, **kwargs):
        kwargs['label'] = label
        kwargs['values'] = values
        kwargs['start_agg'] = Quantile(interval=interval1)
        kwargs['end_agg'] = Quantile(interval=interval2)
        super(QuartileGlyph, self).__init__(**kwargs)
        self.setup()


class BoxGlyph(AggregateGlyph):
    """Summarizes the distribution with a collection of glyphs.

    A box glyph produces one "box" for a given array of vales. The box
    is made up of multiple other child composite glyphs (intervals,
    scatter) and directly produces glyph renderers for the whiskers,
    as well.
    """

    q1 = Float(help="""Derived value for 25% of all values.""")
    q2 = Float(help="""Derived value for 50% of all values.""")
    q3 = Float(help="""Derived value for 75% of all values.""")
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

        bar_color = kwargs.pop('color', None) or kwargs.get('bar_color') or self.lookup('bar_color').class_default()

        kwargs['outliers'] = kwargs.pop('outliers', None) or outliers
        kwargs['label'] = label
        kwargs['values'] = values

        x_label = kwargs.get('x_label')
        kwargs['q2_glyph'] = QuartileGlyph(label=label, x_label=x_label, values=values,
                                           interval1=0.25, interval2=0.5, width=width,
                                           color=bar_color)
        kwargs['q3_glyph'] = QuartileGlyph(label=label, x_label=x_label, values=values,
                                           interval1=0.5, interval2=0.75, width=width,
                                           color=bar_color)
        super(BoxGlyph, self).__init__(**kwargs)
        self.setup()

    def build_renderers(self):
        """Yields all renderers that make up the BoxGlyph."""

        self.calc_quartiles()
        outlier_values = self.values[((self.values < self.w0) | (self.values > self.w1))]

        self.whisker_glyph = GlyphRenderer(glyph=Segment(x0='x0s', y0='y0s', x1='x1s', y1='y1s',
                                           line_width=self.whisker_line_width,
                                           line_color=self.whisker_color))

        if len(outlier_values) > 0 and self.outliers:
            self.outliers = PointGlyph(label=self.label, y=outlier_values,
                                       x=[self.get_dodge_label()] * len(outlier_values),
                                       line_color=self.outlier_line_color,
                                       fill_color=self.outlier_fill_color,
                                       size=self.outlier_size, marker=self.marker)

        for comp_glyph in self.composite_glyphs:
            for renderer in comp_glyph.renderers:
                yield renderer

        yield self.whisker_glyph

    def calc_quartiles(self):
        """Sets all derived stat properties of the BoxGlyph."""
        self.q1 = self.q2_glyph.start
        self.q2 = self.q2_glyph.end
        self.q3 = self.q3_glyph.end
        self.iqr = self.q3 - self.q1

        mx = Max()
        mx.set_data(self.values)

        mn = Min()
        mn.set_data(self.values)

        self.w0 = max(self.q1 - (1.5 * self.iqr), mn.value)
        self.w1 = min(self.q3 + (1.5 * self.iqr), mx.value)

    def build_source(self):
        """Calculate stats and builds and returns source for whiskers."""
        self.calc_quartiles()
        x_label = self.get_dodge_label()
        x_w0_label = self.get_dodge_label(shift=(self.whisker_width / 2.0))
        x_w1_label = self.get_dodge_label(shift=-(self.whisker_width / 2.0))

        # span0, whisker bar0, span1, whisker bar1
        x0s = [x_label, x_w0_label, x_label, x_w0_label]
        y0s = [self.w0, self.w0, self.q3, self.w1]
        x1s = [x_label, x_w1_label, x_label, x_w1_label]
        y1s = [self.q1, self.w0, self.w1, self.w1]

        return dict(x0s=x0s, y0s=y0s, x1s=x1s, y1s=y1s)

    def _set_sources(self):
        """Set the column data source on the whisker glyphs."""
        self.whisker_glyph.data_source = self.source

    def get_extent(self, func, prop_name):
        return func([getattr(renderer, prop_name) for renderer in self.composite_glyphs])

    @property
    def composite_glyphs(self):
        """Returns list of composite glyphs, excluding the regular glyph renderers."""
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

    # derived models
    bins = Instance(BinnedStat, help="""A stat used to calculate the bins. The bins stat
        includes attributes about each composite bin.""")
    bars = List(Instance(BarGlyph), help="""The histogram is comprised of many
        BarGlyphs that are derived from the values.""")
    density = Bool(False, help="""
        Whether to normalize the histogram.

        If True, the result is the value of the probability *density* function
        at the bin, normalized such that the *integral* over the range is 1. If
        False, the result will contain the number of samples in each bin.

        For more info check :class:`~bokeh.charts.stats.Histogram` documentation.

        (default: False)
    """)

    def __init__(self, values, label=None, color=None, bins=None, **kwargs):
        if label is not None:
            kwargs['label'] = label
        kwargs['values'] = values

        if color is not None:
            kwargs['color'] = color

        # remove width, since this is handled automatically
        kwargs.pop('width', None)

        # keep original bins setting private since it just needs to be
        # delegated to the Histogram stat
        self._bins = bins

        super(HistogramGlyph, self).__init__(**kwargs)
        self.setup()

    def _set_sources(self):
        # No need to set sources, since composite glyphs handle this
        pass

    def build_source(self):
        # No need to build source, since composite glyphs handle this
        return None

    def build_renderers(self):
        """Yield a bar glyph for each bin."""
        # TODO(fpliger): We should expose the bin stat class so we could let
        #               users specify other bins other the Histogram Stat
        self.bins = Histogram(values=self.values, bins=self._bins,
            density=self.density)

        bars = []
        for bin in self.bins.bins:
            bars.append(BarGlyph(label=bin.label[0], x_label=bin.center,
                                 values=bin.values, color=self.color,
                                 fill_alpha=self.fill_alpha,
                                 agg=bin.stat, width=bin.width))

        # provide access to bars as children for bounds properties
        self.bars = self.children = bars

        for comp_glyph in self.bars:
            for renderer in comp_glyph.renderers:
                yield renderer

    @property
    def y_min(self):
        return 0.0


class BinGlyph(XyGlyph):
    """Represents a group of data that was aggregated and is represented by a glyph.

    """
    bins = Instance(Bins)
    column = String()
    stat = String()

    glyph_name = String()

    width = Float()
    height = Float()

    def __init__(self, x, y, values, column=None, stat='count', glyph='rect', width=1,
                 height=1, **kwargs):
        df = pd.DataFrame(dict(x_vals=x, y_vals=y, values_vals=values))
        df.drop_duplicates(inplace=True)

        kwargs['x'] = df.x_vals
        kwargs['y'] = df.y_vals
        kwargs['values'] = df.values_vals
        kwargs['column'] = column
        kwargs['stat'] = stat
        kwargs['glyph_name'] = glyph
        kwargs['height'] = height
        kwargs['width'] = width
        if 'glyphs' not in kwargs:
            kwargs['glyphs'] = {'rect': Rect}
        super(XyGlyph, self).__init__(**kwargs)
        self.setup()

    def build_source(self):
        return {'x': self.x, 'y': self.y, 'values': self.values}

    def build_renderers(self):
        glyph_class = self.glyphs[self.glyph_name]
        glyph = glyph_class(x='x', y='y', height=self.height, width=self.width,
                            fill_color=self.fill_color, line_color=self.line_color,
                            dilate=True)
        yield GlyphRenderer(glyph=glyph)

    @property
    def x_max(self):
        return self.get_data_range('x')[1] + self.width / 2.0

    @property
    def x_min(self):
        return self.get_data_range('x')[0] - self.width / 2.0

    @property
    def y_max(self):
        return self.get_data_range('y')[1] + self.height / 2.0

    @property
    def y_min(self):
        return self.get_data_range('y')[0] - self.height / 2.0

    def get_data_range(self, col):
        data = self.source.data[col]
        if ChartDataSource.is_number(data):
            return min(data), max(data)
        else:
            return 1, len(data.drop_duplicates())


class ArcGlyph(LineGlyph):
    """Represents a group of data as an arc."""
    start_angle = Angle()
    end_angle = Angle()

    def __init__(self, **kwargs):
        super(self.__class__, self).__init__(**kwargs)
        self.setup()

    def build_renderers(self):
        """Yield a `GlyphRenderer` for the group of data."""
        glyph = Arc(x='x', y='y', radius=1,
                    start_angle='_end_angle',
                    end_angle='_start_angle',
                    line_color='line_color')
        yield GlyphRenderer(glyph=glyph)
