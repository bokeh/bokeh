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

class DataRange(Range):
    sources = List(Instance(ColumnsRef))

    def finalize(self, models):
        props = super(DataRange, self).finalize(models)
        props['sources'] = [ ColumnsRef(**source) for source in props['sources'] ]
        return props

class DataRange1d(DataRange):
    """ Represents an auto-fitting range in a scalar dimension. """
    rangepadding = Float(0.1)
    start = Float
    end = Float

class FactorRange(Range):
    """ Represents a range in a categorical dimension """
    factors = List(Any)
