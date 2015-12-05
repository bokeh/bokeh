""" Models for describing different kinds of ranges of values
in different kinds of spaces (e.g., continuous or categorical)
and with options for "auto sizing".

"""
from __future__ import absolute_import

from ..model import Model
from ..properties import abstract
from ..properties import Int, Float, String, Datetime, Instance, List, Either, Auto, Tuple
from .callbacks import Callback
from .renderers import Renderer


@abstract
class Range(Model):
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

    bounds = Either(
        Auto,
        Tuple(Float, Float),
        Tuple(Datetime, Datetime),
        Tuple(Int, Int),
        help="""
    The bounds that the range is allowed to go to - typically used to prevent
    the user from panning/zooming/etc away from the data.

    By default, the bounds will be computed to the start and end of the Range.

    Bounds are provided as a tuple of ``(min, max)`` so regardless of whether your range is
    increasing or decreasing, the first item should be the minimum value of the range and the
    second item should be the maximum. Setting min > max will result in a ``ValueError``.

    Setting bounds to ``None`` will allow your plot to pan/zoom as far as you want. If you only
    want to constrain one end of the plot, you can set min or max to None.

    Examples:

        Range1d(0, 1)  # Increasing range, auto-bounded to 0 and 1 (Default behavior)
        Range1d(0, 1, bounds=(-0.1, 1.1))  # Increasing range with bounds at -0.1 and 1.1
        Range1d(1, 0, bounds=(-0.1, 1.1))  # Decreasing range with bounds at -0.1 and 1.1
        Range1d(0, 1, bounds=(0, None))  # Increasing range bounded at minimum of 0, unbounded maximum
        Range1d(start=0, end=1, bounds=None)  # Unbounded range
    """)

    def __init__(self, *args, **kwargs):
        if args and ('start' in kwargs or 'end' in kwargs):
            raise ValueError("'start' and 'end' keywords cannot be used with positional arguments")
        if args and len(args) != 2:
            raise ValueError('Only Range1d(start, end) acceptable when using positional arguments')

        if args:
            kwargs['start'] = args[0]
            kwargs['end'] = args[1]

        super(Range1d, self).__init__(**kwargs)

        if self.bounds and self.bounds != 'auto':
            if self.bounds[0] > self.bounds[1]:
                raise ValueError('Invalid bounds: maximum smaller than minimum. Correct usage: bounds=(min, max)')


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
    The upper and lower bounds are set to the min and max of the data.
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

    bounds = Either(Auto, Tuple(Float, Float), help="""
    The bounds that the range is allowed to go to - typically used to prevent
    the user from panning/zooming/etc away from the data.

    By default, the bounds will be computed to be the same as the start and end of the DataRange1d.

    Bounds are provided as a tuple of ``(min, max)`` so regardless of whether your range is
    increasing or decreasing, the first item should be the minimum value of the range and the
    second item should be the maximum. Setting min > max will result in a ``ValueError``.

    Setting bounds to None will allow your plot to pan/zoom as far as you want. If you only
    want to constrain one end of the plot, you can set min or max to
    ``None`` e.g. ``DataRange1d(bounds=(None,12))``
    """)

    def __init__(self, *args, **kwargs):
        super(DataRange1d, self).__init__(**kwargs)

        if self.bounds and self.bounds != 'auto':
            if self.bounds[0] > self.bounds[1]:
                raise ValueError('Invalid bounds: maximum smaller than minimum. Correct usage: bounds=(min, max)')


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

    bounds = Either(Auto, List(String), List(Int), help="""
    The bounds that the range is allowed to go to - typically used to prevent
    the user from panning/zooming/etc away from the data.

    Unlike Range1d and DataRange1d, factors do not have an order and so a min and max cannot be
    provied in the same way. bounds accepts a list of factors, that constrain the displayed factors.

    The plot is then constrained to not pan or zoom beyond the first and last item in the list of
    factors. Providing None allows unlimited panning or zooming.

    By default, bounds will be the same as factors and the plot will not be able to
    pan or zoom beyond the first and last items in factors.

    If you provide a list, then only the factors that are in that list will be displayed on the
    plot and the plot will not pan or zoom outside the first and last items in the shortened
    factors list. Note the order of factors is the defining order for your plot.

    Values of bounds that are not in factors are acceptable and will simply have no impact
    on the plot.

    Examples
    --------

    Default behavior:
        x_range = FactorRange(factors=["apples", "dogs", "peaches", "bananas", "pigs"])

        The plot will display all the factors and you will not be able to pan left of apples or right
        of pigs.

    Constraining behavior:
        x_range = FactorRange(factors=["apples", "dogs", "peaches", "bananas", "pigs"], bounds=["apples", "bananas", "peaches"])

        The plot will display the chart with only the factors ["apples", "peaches", "bananas"] (in that order)
        and the plot will not pan left of apples or right of bananas.
    """)


    def __init__(self, *args, **kwargs):
        if args and "factors" in kwargs:
            raise ValueError("'factors' keyword cannot be used with positional arguments")
        elif args:
            kwargs['factors'] = list(args)
        super(FactorRange, self).__init__(**kwargs)
