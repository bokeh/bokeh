from __future__ import absolute_import

from ..properties import Int, Float, String, Enum, Auto, Instance, Tuple, Either, Include
from ..mixins import LineProps, TextProps
from ..enums import Location

from .renderers import GuideRenderer
from .tickers import Ticker, BasicTicker, LogTicker, CategoricalTicker, DatetimeTicker
from .formatters import TickFormatter, BasicTickFormatter, LogTickFormatter, CategoricalTickFormatter, DatetimeTickFormatter

class Axis(GuideRenderer):
    """ Axis is a base class for all Axis objects, and is not generally
    useful to instantiate on its own.

    """

    location = Either(Auto, Enum(Location), help="""
    Where the axis should be positioned on the plot.
    """)

    bounds = Either(Auto, Tuple(Float, Float), help="""
    Constrain the Axis to only draw between specified bounds.
    """)

    x_range_name = String('default', help="""
    Configure this Axis to use a particular (named) Range of
    the associated Plot.
    """)

    y_range_name = String('default', help="""
    Configure this Axis to use a particular (named) Range of
    the associated Plot.
    """)

    ticker = Instance(Ticker, help="""
    Configure a Ticker to specify how major tick locations are chosen.
    """)

    formatter = Instance(TickFormatter, help="""
    Configure a TickFormatter to specify how tick values are formatted.
    """)

    axis_label = String(help="""
    A text label for the axis, displayed parallel to the axis rule

    .. note::
        LaTeX notation is not currently supported; please see
        `issue 647 <https://github.com/bokeh/bokeh/issues/647>`_ to
        track progress or contribute.
    """)

    axis_label_standoff = Int(help="""
    Distance in pixels that the axis labels should be offset from
    the tick labels.
    """)

    axis_label_props = Include(TextProps, help="""
    Set the %s of the axis label.
    """)

    major_label_standoff = Int(help="""
    Distance in pixels that the major tick labels should be offset
    from the associated ticks.
    """)

    major_label_orientation = Either(Enum("horizontal", "vertical"), Float, help="""
    What direction the major label text should be oriented. If a number
    is supplied, the angle of the text is measured from horizontal.
    """)

    major_label_props = Include(TextProps, help="""
    Set the %s of the major tick labels.
    """)

    axis_props = Include(LineProps, help="""
    Set the %s of the axis line.
    """)

    major_tick_props = Include(LineProps, help="""
    Set the %s of the major ticks.
    """)

    major_tick_in = Int(help="""
    Distance in pixels that major ticks should extend into the main
    plot area.
    """)

    major_tick_out = Int(help="""
    Distance in pixels that major ticks should extend out of the main
    plot area.
    """)

    minor_tick_props = Include(LineProps, help="""
    Set the %s of the minor ticks.
    """)

    minor_tick_in = Int(help="""
    Distance in pixels that minor ticks should extend into the main
    plot area.
    """)

    minor_tick_out = Int(help="""
    Distance in pixels that major ticks should extend out of the main
    plot area.
    """)

class ContinuousAxis(Axis):
    pass

class LinearAxis(ContinuousAxis):
    def __init__(self, ticker=None, formatter=None, **kwargs):
        if ticker is None:
            ticker = BasicTicker()
        if formatter is None:
            formatter = BasicTickFormatter()
        super(LinearAxis, self).__init__(ticker=ticker, formatter=formatter, **kwargs)

class LogAxis(ContinuousAxis):
    def __init__(self, ticker=None, formatter=None, **kwargs):
        if ticker is None:
            ticker = LogTicker(num_minor_ticks=10)
        if formatter is None:
            formatter = LogTickFormatter(ticker=ticker)
        super(LogAxis, self).__init__(ticker=ticker, formatter=formatter, **kwargs)

class CategoricalAxis(Axis):
    def __init__(self, ticker=None, formatter=None, **kwargs):
        if ticker is None:
            ticker = CategoricalTicker()
        if formatter is None:
            formatter = CategoricalTickFormatter()
        super(CategoricalAxis, self).__init__(ticker=ticker, formatter=formatter, **kwargs)

class DatetimeAxis(LinearAxis):
    axis_label = String("date")
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
