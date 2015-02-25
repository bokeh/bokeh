""" Guide renderers for various kinds of axes that can be added to
Bokeh plots

"""
from __future__ import absolute_import

from ..properties import Int, Float, String, Enum, Bool, Datetime, Auto, Instance, Tuple, Either, Include
from ..mixins import LineProps, TextProps
from ..enums import Location

from .renderers import GuideRenderer
from .tickers import Ticker, BasicTicker, LogTicker, CategoricalTicker, DatetimeTicker
from .formatters import TickFormatter, BasicTickFormatter, LogTickFormatter, CategoricalTickFormatter, DatetimeTickFormatter

class Axis(GuideRenderer):
    """ A base class that defines common properties for all axis types.
    ``Axis`` is not generally useful to instantiate on its own.

    """

    visible = Bool(True, help="""
    Ability to hide the entire axis from the plot.
    """)

    location = Either(Auto, Enum(Location), help="""
    Where should labels and ticks be located in relation to the axis rule.
    """)

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
    """)

    formatter = Instance(TickFormatter, help="""
    A TickFormatter to use for formatting the visual appearance
    of ticks.
    """)

    axis_label = String(help="""
    A text label for the axis, displayed parallel to the axis rule.

    .. note::
        LaTeX notation is not currently supported; please see
        :bokeh-issue:`647` to track progress or contribute.

    """)

    axis_label_standoff = Int(help="""
    The distance in pixels that the axis labels should be offset
    from the tick labels.
    """)

    axis_label_props = Include(TextProps, help="""
    The %s of the axis label.
    """)

    major_label_standoff = Int(help="""
    The distance in pixels that the major tick labels should be
    offset from the associated ticks.
    """)

    major_label_orientation = Either(Enum("horizontal", "vertical"), Float, help="""
    What direction the major label text should be oriented. If a i
    number is supplied, the angle of the text is measured from horizontal.
    """)

    major_label_props = Include(TextProps, help="""
    The %s of the major tick labels.
    """)

    axis_props = Include(LineProps, help="""
    The %s of the axis line.
    """)

    major_tick_props = Include(LineProps, help="""
    The %s of the major ticks.
    """)

    major_tick_in = Int(help="""
    The distance in pixels that major ticks should extend into the
    main plot area.
    """)

    major_tick_out = Int(help="""
    The distance in pixels that major ticks should extend out of the
    main plot area.
    """)

    minor_tick_props = Include(LineProps, help="""
    The %s of the minor ticks.
    """)

    minor_tick_in = Int(help="""
    The distance in pixels that minor ticks should extend into the
    main plot area.
    """)

    minor_tick_out = Int(help="""
    The distance in pixels that major ticks should extend out of the
    main plot area.
    """)

class ContinuousAxis(Axis):
    """ A base class for all numeric, non-categorica axes types.
    ``ContinuousAxis`` is not generally useful to instantiate on its own.

    """
    pass

class LinearAxis(ContinuousAxis):
    """ An axis that picks nice numbers for tick locations on a
    linear scale. Configured with a ``BasicTickFormatter`` by default.

    """
    def __init__(self, ticker=None, formatter=None, **kwargs):
        if ticker is None:
            ticker = BasicTicker()
        if formatter is None:
            formatter = BasicTickFormatter()
        super(LinearAxis, self).__init__(ticker=ticker, formatter=formatter, **kwargs)

class LogAxis(ContinuousAxis):
    """ An axis that picks nice numbers for tick locations on a
    log scale. Configured with a ``LogTickFormatter`` by default.

    """

    def __init__(self, ticker=None, formatter=None, **kwargs):
        if ticker is None:
            ticker = LogTicker(num_minor_ticks=10)
        if formatter is None:
            formatter = LogTickFormatter(ticker=ticker)
        super(LogAxis, self).__init__(ticker=ticker, formatter=formatter, **kwargs)

class CategoricalAxis(Axis):
    """ An axis that picks evenly spaced tick locations for a
    collection of categories/factors.

    """
    def __init__(self, ticker=None, formatter=None, **kwargs):
        if ticker is None:
            ticker = CategoricalTicker()
        if formatter is None:
            formatter = CategoricalTickFormatter()
        super(CategoricalAxis, self).__init__(ticker=ticker, formatter=formatter, **kwargs)

class DatetimeAxis(LinearAxis):
    """ An LinearAxis that picks nice numbers for tick locations on
    a datetime scale. Configured with a ``DatetimeTickFormatter`` by
    default.

    """
    axis_label = String("date", help="""
    DateTime ``axis_label`` defaults to "date".
    """)

    # TODO: (bev) this should be an Enum, if it is exposed at all
    scale = String("time")

    num_labels = Int(8)

    char_width = Int(10)

    fill_ratio = Float(0.3)

    def __init__(self, ticker=None, formatter=None, **kwargs):
        if ticker is None:
            ticker = DatetimeTicker()
        if formatter is None:
            formatter = DatetimeTickFormatter()
        super(DatetimeAxis, self).__init__(ticker=ticker, formatter=formatter, **kwargs)
