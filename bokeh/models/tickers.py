""" Models for computing good tick locations on different kinds
of plots.

"""
from __future__ import absolute_import

from ..model import Model
from ..core.properties import abstract
from ..core.properties import Int, Float, Seq, Instance, Override


@abstract
class Ticker(Model):
    """ A base class for all ticker types. ``Ticker`` is not generally
    useful to instantiate on its own.

    """

@abstract
class ContinuousTicker(Ticker):
    """ A base class for non-categorical ticker types. ``ContinuousTicker``
    is not generally useful to instantiate on its own.

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

class FixedTicker(ContinuousTicker):
    """ Generate ticks at fixed, explicitly supplied locations.

    .. note::
        The ``desired_num_ticks`` property is ignored by this Ticker.

    """

    ticks = Seq(Float, default=[], help="""
    List of tick locations.
    """)


class AdaptiveTicker(ContinuousTicker):
    """ Generate "nice" round ticks at any magnitude.

    Creates ticks that are "base" multiples of a set of given
    mantissas. For example, with ``base=10`` and
    ``mantissas=[1, 2, 5]``, the ticker will generate the sequence::

        ..., 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, ...

    """

    base = Float(10.0, help="""
    The multiplier to use for scaling mantissas.
    """)

    mantissas = Seq(Float, [1, 2, 5], help="""
    The acceptable list numbers to generate multiples of.
    """)

    min_interval = Float(0.0, help="""
    The smallest allowable interval between two adjacent ticks.
    """)

    max_interval = Float(help="""
    The largest allowable interval between two adjacent ticks.

    .. note::
        To specify an unbounded interval, set to ``None``.
    """)

class CompositeTicker(ContinuousTicker):
    """ Combine different tickers at different scales.

    Uses the ``min_interval`` and ``max_interval`` interval attributes
    of the tickers to select the appropriate ticker at different
    scales.

    """

    tickers = Seq(Instance(Ticker), default=[], help="""
    A list of Ticker objects to combine at different scales in order
    to generate tick values. The supplied tickers should be in order.
    Specifically, if S comes before T, then it should be the case that::

        S.get_max_interval() < T.get_min_interval()

    """)

class SingleIntervalTicker(ContinuousTicker):
    """ Generate evenly spaced ticks at a fixed interval regardless of
    scale.

    """

    interval = Float(help="""
    The interval between adjacent ticks.
    """)

class DaysTicker(SingleIntervalTicker):
    """ Generate ticks spaced apart by specific, even multiples of days.

    """
    days = Seq(Int, default=[], help="""
    The intervals of days to use.
    """)

class MonthsTicker(SingleIntervalTicker):
    """ Generate ticks spaced apart by specific, even multiples of months.

    """
    months = Seq(Int, default=[], help="""
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
    mantissas = Override(default=[1, 5])

class CategoricalTicker(Ticker):
    """ Generate ticks for categorical ranges.

    """

ONE_MILLI = 1.0
ONE_SECOND = 1000.0
ONE_MINUTE = 60.0 * ONE_SECOND
ONE_HOUR = 60 * ONE_MINUTE
ONE_DAY = 24 * ONE_HOUR
ONE_MONTH = 30 * ONE_DAY # An approximation, obviously.
ONE_YEAR = 365 * ONE_DAY

class DatetimeTicker(CompositeTicker):
    """ Generate nice ticks across different date and time scales.

    """
    num_minor_ticks = Override(default=0)
    tickers = Override(default=lambda: [
        AdaptiveTicker(
            mantissas=[1, 2, 5],
            base=10,
            min_interval=0,
            max_interval=500*ONE_MILLI,
            num_minor_ticks=0
        ),
        AdaptiveTicker(
            mantissas=[1, 2, 5, 10, 15, 20, 30],
            base=60,
            min_interval=ONE_SECOND,
            max_interval=30*ONE_MINUTE,
            num_minor_ticks=0
        ),
        AdaptiveTicker(
            mantissas=[1, 2, 4, 6, 8, 12],
            base=24,
            min_interval=ONE_HOUR,
            max_interval=12*ONE_HOUR,
            num_minor_ticks=0
        ),
        DaysTicker(days=list(range(1, 32))),
        DaysTicker(days=list(range(1, 31, 3))),
        DaysTicker(days=[1, 8, 15, 22]),
        DaysTicker(days=[1, 15]),

        MonthsTicker(months=list(range(0, 12, 1))),
        MonthsTicker(months=list(range(0, 12, 2))),
        MonthsTicker(months=list(range(0, 12, 4))),
        MonthsTicker(months=list(range(0, 12, 6))),

        YearsTicker(),
    ])
