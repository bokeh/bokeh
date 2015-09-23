""" Models for describing different kinds of ranges of values
in different kinds of spaces (e.g., continuous or categorical)
and with options for "auto sizing".

"""
from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import abstract
from ..properties import Int, Float, String, Datetime, Instance, List, Either
from .callbacks import Callback
from .renderers import Renderer

@abstract
class Range(PlotObject):
    """ A base class for all range types. ``Range`` is not generally
    useful to instantiate on its own.

    """

    callback = Instance(Callback, help="""
    A callback to run in the browser whenever the range is updated.
    """)

class Range1d(Range):
    """ A fixed, closed range [start, end] in a continuous scalar
    dimension.

    In addition to supplying ``start`` and ``end`` keyword arguments
    to the ``Range1d`` initializer, you can also instantiate with
    the convenience syntax::

        Range(0, 10) # equivalent to Range(start=0, end=10)

    """

    start = Either(Float, Datetime, Int, help="""
    The start of the range.
    """)

    end = Either(Float, Datetime, Int, help="""
    The end of the range.
    """)

    def __init__(self, *args, **kwargs):
        if args and ('start' in kwargs or 'end' in kwargs):
            raise ValueError("'start' and 'end' keywords cannot be used with positional arguments")
        elif args and len(args) != 2:
            raise ValueError('Only Range1d(start, end) acceptable when using positional arguments')
        elif args:
            kwargs['start'] = args[0]
            kwargs['end'] = args[1]
        super(Range1d, self).__init__(**kwargs)

@abstract
class DataRange(Range):
    """ A base class for all data range types. ``DataRange`` is not
    generally useful to instantiate on its own.

    """

    names = List(String, help="""
    A list of names to query for. If set, only renderers that
    have a matching value for their ``name`` attribute will be used
    for autoranging.
    """)

    renderers = List(Instance(Renderer), help="""
    An explicit list of renderers to autorange against. If unset,
    defaults to all renderers on a plot.
    """)

class DataRange1d(DataRange):
    """ An auto-fitting range in a continuous scalar dimension.

    """

    range_padding = Float(0.1, help="""
    A percentage of the total range size to add as padding to
    the range start and end.
    """)

    start = Float(help="""
    An explicitly supplied range start. If provided, will override
    automatically computed start value.
    """)

    end = Float(help="""
    An explicitly supplied range end. If provided, will override
    automatically computed end value.
    """)

class FactorRange(Range):
    """ A range in a categorical dimension.

    In addition to supplying ``factors`` keyword argument to the
    ``FactorRange`` initializer, you can also instantiate with
    the convenience syntax::

        FactorRange("foo", "bar") # equivalent to FactorRange(factors=["foo", "bar"])

    .. note::
        ``FactorRange`` may be renamed to ``CategoricalRange`` in
        the future.

    """

    offset = Float(0, help="""
    An offset to the (synthetic) range (default: 0)

    .. note::
        The primary usage of this is to support compatibility and integration
        with other plotting systems, and will not generally of interest to
        most users.
    """)

    factors = Either(List(String), List(Int), help="""
    A list of string or integer factors (categories) to comprise
    this categorical range.
    """)

    def __init__(self, *args, **kwargs):
        if args and "factors" in kwargs:
            raise ValueError("'factors' keyword cannot be used with positional arguments")
        elif args:
            kwargs['factors'] = list(args)
        super(FactorRange, self).__init__(**kwargs)
