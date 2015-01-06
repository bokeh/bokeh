from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Int, Float, List, Instance

class Ticker(PlotObject):
    """ Base class for all ticker types. """
    num_minor_ticks = Int(5)

class AdaptiveTicker(Ticker):
    """ Generate nice round ticks at any magnitude.

    Creates ticks that are `base` multiples of a set of given
    mantissas. For example, with base=10 and mantissas=[1, 2, 5] this
    ticker will generate the sequence:

            ..., 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, ...

    Attributes:
        base (float) : multiplier for scaling mantissas
        mantissas list(float) : numbers to generate multiples of
        min_interval (float) : smallest interval between two ticks
        max_interval (float) : largest interval between two ticks

    """
    base = Float(10.0)
    mantissas = List(Float, [2, 5, 10])
    min_interval = Float(0.0)
    max_interval = Float(100.0)

class CompositeTicker(Ticker):
    """ Combine different tickers at different scales.

    Uses the `min_interval` and `max_interval` interval attributes of the
    tickers to order the tickers. The supplied tickers should be in order.
    Specifically, if S comes before T, then it should be the case that:

        S.get_max_interval() < T.get_min_interval()

    Attributes:
        tickers (Ticker) : a list of tickers in increasing interval size

    """
    tickers = List(Instance(Ticker))

class SingleIntervalTicker(Ticker):
    """ Generate evenly spaced ticks at a fixed interval regardless of scale.

    Attributes:
        interval (float) : interval between two ticks
    """
    interval = Float

class DaysTicker(SingleIntervalTicker):
    """ Generate ticks spaced apart by specific, even multiples of days.

    Attributes:
        days (int) : intervals of days to use

    """
    days = List(Int)

class MonthsTicker(SingleIntervalTicker):
    """ Generate ticks spaced apart by specific, even multiples of months.

    Attributes:
        months (int) : intervals of months to use

    """
    months = List(Int)

class YearsTicker(SingleIntervalTicker):
    """ Generate ticks spaced even numbers of years apart. """
    pass

class BasicTicker(AdaptiveTicker):
    """ Generate ticks on a linear scale. """
    pass

class LogTicker(AdaptiveTicker):
    """ Generate ticks on a log scale. """
    pass

class CategoricalTicker(Ticker):
    """ Generate ticks for categorical ranges. """
    pass

class DatetimeTicker(CompositeTicker):
    """ Generate nice ticks across different date and time scales. """
    pass
