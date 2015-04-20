""" Models for computing good tick locations on different kinds
of plots.

"""
from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Int, Float, List, Instance

class Ticker(PlotObject):
    """ A base class for all ticker types. ``Ticker`` is
    not generally useful to instantiate on its own.

    """

    num_minor_ticks = Int(5, help="""
    The number of minor tick positions to generate between
    adjacent major tick values.
    """)

    desired_num_ticks = Int(6, help="""
    A desired target number of major tick positions to generate across
    the plot range.

    .. note:
        This value is a suggestion, and ticker subclasses may ignore
        it entirely, or use it only as an ideal goal to approach as well
        as can be, in the context of a specific ticking strategy.
    """)

class AdaptiveTicker(Ticker):
    """ Generate "nice" round ticks at any magnitude.

    Creates ticks that are "base" multiples of a set of given
    mantissas. For example, with ``base=10`` and
    ``mantissas=[1, 2, 5]``, the ticker will generate the sequence::

        ..., 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, ...

    """

    base = Float(10.0, help="""
    The multiplier to use for scaling mantissas.
    """)

    mantissas = List(Float, [2, 5, 10], help="""
    The acceptable list numbers to generate multiples of.
    """)

    min_interval = Float(0.0, help="""
    The smallest allowable interval between two adjacent ticks.
    """)

    max_interval = Float(100.0, help="""
    The largest allowable interval between two adjacent ticks.
    """)

class CompositeTicker(Ticker):
    """ Combine different tickers at different scales.

    Uses the ``min_interval`` and ``max_interval`` interval attributes
    of the tickers to select the appropriate ticker at different
    scales.

    """

    tickers = List(Instance(Ticker), help="""
    A list of Ticker objects to combine at different scales in order
    to generate tick values. The supplied tickers should be in order.
    Specifically, if S comes before T, then it should be the case that::

        S.get_max_interval() < T.get_min_interval()

    """)

class SingleIntervalTicker(Ticker):
    """ Generate evenly spaced ticks at a fixed interval regardless of
    scale.

    """

    interval = Float(help="""
    The interval between adjacent ticks.
    """)

class DaysTicker(SingleIntervalTicker):
    """ Generate ticks spaced apart by specific, even multiples of days.

    """
    days = List(Int, help="""
    The intervals of days to use.
    """)

class MonthsTicker(SingleIntervalTicker):
    """ Generate ticks spaced apart by specific, even multiples of months.

    """
    months = List(Int, help="""
    The intervals of months to use.
    """)

class YearsTicker(SingleIntervalTicker):
    """ Generate ticks spaced apart even numbers of years.

    """

class BasicTicker(AdaptiveTicker):
    """ Generate ticks on a linear scale.

    .. note::
        This class may be renamed to ``LinearTicker`` in the future.

    """

class LogTicker(AdaptiveTicker):
    """ Generate ticks on a log scale.

    """

class CategoricalTicker(Ticker):
    """ Generate ticks for categorical ranges.

    """

class DatetimeTicker(Ticker):
    """ Generate nice ticks across different date and time scales.

    """