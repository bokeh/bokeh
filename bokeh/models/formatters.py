from __future__ import absolute_import

from .tickers import Ticker
from ..plot_object import PlotObject
from ..properties import Bool, Int, String, Enum, Auto, List, Dict, Either, Instance
from ..enums import DatetimeUnits

class TickFormatter(PlotObject):
    """ Base class for all tick formatter types. """
    pass

class BasicTickFormatter(TickFormatter):
    """ Format ticks as generic numbers from a continuous numeric range

    Attributes:
        precision ('auto' or int) : how many digits of precision to display
        use_scientific (bool) : whether to switch to scientific notation
            when to switch controlled by `power_limit_low` and `power_limit_high`
        power_limit_high (int) : use scientific notation on numbers this large
        power_limit_low (int) : use scientific notation on numbers this small

    """
    precision = Either(Auto, Int)
    use_scientific = Bool(True)
    power_limit_high = Int(5)
    power_limit_low = Int(-3)

class LogTickFormatter(TickFormatter):
    """ Format ticks as powers of 10.

    Often useful in conjuction with a `LogTicker`

    """
    ticker = Instance(Ticker)

class CategoricalTickFormatter(TickFormatter):
    """ Format ticks as categories from categorical ranges"""
    pass

class DatetimeTickFormatter(TickFormatter):
    """ Represents a categorical tick formatter for an axis object """
    formats = Dict(Enum(DatetimeUnits), List(String))
