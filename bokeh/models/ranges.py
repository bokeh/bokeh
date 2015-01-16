from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Int, Float, String, Datetime, Instance, List, Either
from .sources import ColumnsRef

class Range(PlotObject):
    pass

class Range1d(Range):
    """ Represents a fixed range [start, end] in a scalar dimension. """
    start = Either(Float, Datetime, Int)
    end = Either(Float, Datetime, Int)

    def __init__(self, *args, **kwargs):
        if args and ('start' in kwargs or 'end' in kwargs):
            raise ValueError("'start' and 'end' keywords cannot be used with positional arguments")
        elif args and len(args) != 2:
            raise ValueError('Only Range1d(start, end) acceptable when using positional arguments')
        elif args:
            kwargs['start'] = args[0]
            kwargs['end'] = args[1]
        super(Range1d, self).__init__(**kwargs)


class DataRange(Range):
    sources = List(Instance(ColumnsRef))

class DataRange1d(DataRange):
    """ Represents an auto-fitting range in a scalar dimension. """
    rangepadding = Float(0.1)
    start = Float
    end = Float

class FactorRange(Range):
    """ Represents a range in a categorical dimension """
    factors = Either(List(String), List(Int))

    def __init__(self, *args, **kwargs):
        if args and "factors" in kwargs:
            raise ValueError("'factors' keyword cannot be used with positional arguments")
        elif args:
            kwargs['factors'] = list(*args)
        super(FactorRange, self).__init__(**kwargs)
