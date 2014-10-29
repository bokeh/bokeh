from __future__ import absolute_import

from ..properties import Int, Float, String, Enum, Instance, Tuple, Either, Include
from ..mixins import LineProps, TextProps
from ..enums import Location

from .renderers import GuideRenderer
from .tickers import Ticker, BasicTicker, LogTicker, CategoricalTicker, DatetimeTicker
from .formatters import TickFormatter, BasicTickFormatter, LogTickFormatter, CategoricalTickFormatter, DatetimeTickFormatter

class Axis(GuideRenderer):
    location = Either(Enum('auto'), Enum(Location))
    bounds = Either(Enum('auto'), Tuple(Float, Float))

    x_range_name = String('default')
    y_range_name = String('default')

    ticker = Instance(Ticker)
    formatter = Instance(TickFormatter)

    axis_label = String
    axis_label_standoff = Int
    axis_label_props = Include(TextProps)

    major_label_standoff = Int
    major_label_orientation = Either(Enum("horizontal", "vertical"), Float)
    major_label_props = Include(TextProps)

    axis_props = Include(LineProps)
    major_tick_props = Include(LineProps)

    major_tick_in = Int
    major_tick_out = Int

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
            formatter = LogTickFormatter()
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
