from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Any, Int, Float, Datetime, Instance, List, Either
from .sources import ColumnsRef

class Range(PlotObject):
    pass

class Range1d(Range):
    """ Represents a fixed range [start, end] in a scalar dimension. """
    start = Either(Float, Datetime, Int)
    end = Either(Float, Datetime, Int)

    def __init__(self, *args, **kwargs):
        if args and kwargs:
            raise ValueError('Only Range1d(a, b) or Range1d(start=a, end=b) are valid')
        elif args and len(args) != 2:
            raise ValueError('Only Range1d(a, b) acceptable')
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
    factors = List(Any)

    def __init__(self, *args, **kwargs):
        if args and kwargs:
            raise ValueError('Only FactorRange(a) or FactorRange(factors=a) are valid')
        elif args and len(args) != 1:
            raise ValueError('Only FactorRange(a) acceptable')
        elif args:
            kwargs['factors'] = args[0]
        super(FactorRange, self).__init__(**kwargs)
