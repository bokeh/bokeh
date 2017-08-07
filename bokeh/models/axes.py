''' Guide renderers for various kinds of axes that can be added to
Bokeh plots

'''
from __future__ import absolute_import

from ..core.has_props import abstract
from ..core.properties import Auto, Datetime, Dict, Either, Enum, Float, Include, Instance, Int, Override, Seq, String, Tuple
from ..core.property_mixins import LineProps, TextProps

from .formatters import BasicTickFormatter, CategoricalTickFormatter, DatetimeTickFormatter, LogTickFormatter, TickFormatter
from .renderers import GuideRenderer
from .tickers import Ticker, BasicTicker, LogTicker, CategoricalTicker, DatetimeTicker, FixedTicker

@abstract
class Axis(GuideRenderer):
    ''' A base class that defines common properties for all axis types.

    '''

    bounds = Either(Auto, Tuple(Float, Float), Tuple(Datetime, Datetime), help="""
    Bounds for the rendered axis. If unset, the axis will span the
    entire plot in the given dimension.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen
    locations when rendering an axis on the plot. If unset, use the
    default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen
    locations when rendering an axis on the plot. If unset, use the
    default y-range.
    """)

    ticker = Instance(Ticker, help="""
    A Ticker to use for computing locations of axis components.

    The property may also be passed a sequence of floating point numbers as
    a shorthand for creating and configuring a ``FixedTicker``, e.g. the
    following code

    .. code-block:: python

        from bokeh.plotting import figure

        p = figure()
        p.xaxis.ticker = [10, 20, 37.4]

    is equivalent to:

    .. code-block:: python

        from bokeh.plotting import figure
        from bokeh.models.tickers import FixedTicker

        p = figure()
        p.xaxis.ticker = FixedTicker(ticks=[10, 20, 37.4])

    """).accepts(Seq(Float), lambda ticks: FixedTicker(ticks=ticks))

    formatter = Instance(TickFormatter, help="""
    A TickFormatter to use for formatting the visual appearance
    of ticks.
    """)

    axis_label = String(default='', help="""
    A text label for the axis, displayed parallel to the axis rule.

    .. note::
        LaTeX notation is not currently supported; please see
        :bokeh-issue:`647` to track progress or contribute.

    """)

    axis_label_standoff = Int(default=5, help="""
    The distance in pixels that the axis labels should be offset
    from the tick labels.
    """)

    axis_label_props = Include(TextProps, help="""
    The %s of the axis label.
    """)

    axis_label_text_font_size = Override(default={'value': "10pt"})

    axis_label_text_font_style = Override(default="italic")

    major_label_standoff = Int(default=5, help="""
    The distance in pixels that the major tick labels should be
    offset from the associated ticks.
    """)

    major_label_orientation = Either(Enum("horizontal", "vertical"), Float, help="""
    What direction the major label text should be oriented. If a
    number is supplied, the angle of the text is measured from horizontal.
    """)

    major_label_overrides = Dict(Either(Float, String), String, default={}, help="""
    Provide explicit tick label values for specific tick locations that
    override normal formatting.
    """)

    major_label_props = Include(TextProps, help="""
    The %s of the major tick labels.
    """)

    major_label_text_align = Override(default="center")

    major_label_text_baseline = Override(default="alphabetic")

    major_label_text_font_size = Override(default={'value': "8pt"})

    axis_props = Include(LineProps, help="""
    The %s of the axis line.
    """)

    major_tick_props = Include(LineProps, help="""
    The %s of the major ticks.
    """)

    major_tick_in = Int(default=2, help="""
    The distance in pixels that major ticks should extend into the
    main plot area.
    """)

    major_tick_out = Int(default=6, help="""
    The distance in pixels that major ticks should extend out of the
    main plot area.
    """)

    minor_tick_props = Include(LineProps, help="""
    The %s of the minor ticks.
    """)

    minor_tick_in = Int(default=0, help="""
    The distance in pixels that minor ticks should extend into the
    main plot area.
    """)

    minor_tick_out = Int(default=4, help="""
    The distance in pixels that major ticks should extend out of the
    main plot area.
    """)

@abstract
class ContinuousAxis(Axis):
    ''' A base class for all numeric, non-categorical axes types.

    '''
    pass

class LinearAxis(ContinuousAxis):
    ''' An axis that picks nice numbers for tick locations on a
    linear scale. Configured with a ``BasicTickFormatter`` by default.

    '''
    ticker = Override(default=lambda: BasicTicker())

    formatter = Override(default=lambda: BasicTickFormatter())

class LogAxis(ContinuousAxis):
    ''' An axis that picks nice numbers for tick locations on a
    log scale. Configured with a ``LogTickFormatter`` by default.

    '''
    ticker = Override(default=lambda: LogTicker())

    formatter = Override(default=lambda: LogTickFormatter())

class CategoricalAxis(Axis):
    ''' An axis that picks evenly spaced tick locations for a
    collection of categories/factors.

    '''
    ticker = Override(default=lambda: CategoricalTicker())

    formatter = Override(default=lambda: CategoricalTickFormatter())

    separator_props = Include(LineProps, help="""
    The %s of the separator line between top-level categorical groups.
    """)

    separator_line_color = Override(default="lightgrey")

    separator_line_width = Override(default=2)

    group_props = Include(TextProps, help="""
    The %s of the group top-level categorical groups.
    """)

    group_text_font_size = Override(default={'value': "8pt"})
    group_text_font_style = Override(default="bold")
    group_text_color = Override(default="grey")

    subgroup_props = Include(TextProps, help="""
    The %s of the group top-level categorical groups.
    """)

    subgroup_text_font_size = Override(default={'value': "8pt"})
    subgroup_text_font_style = Override(default="bold")


class DatetimeAxis(LinearAxis):
    ''' An LinearAxis that picks nice numbers for tick locations on
    a datetime scale. Configured with a ``DatetimeTickFormatter`` by
    default.

    '''

    ticker = Override(default=lambda: DatetimeTicker())

    formatter = Override(default=lambda: DatetimeTickFormatter())
