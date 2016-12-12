""" Models for describing different kinds of ranges of values
in different kinds of spaces (e.g., continuous or categorical)
and with options for "auto sizing".

"""
from __future__ import absolute_import

from ..model import Model
from ..core.enums import StartEnd
from ..core.properties import abstract
from ..core.properties import (
    Auto, Bool, Int, Float, String, Datetime, TimeDelta, Instance, List,
    Either, Enum, MinMaxBounds,
)
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

    start = Either(Float, Datetime, Int, default=0, help="""
    The start of the range.
    """)

    end = Either(Float, Datetime, Int, default=1, help="""
    The end of the range.
    """)

    bounds = MinMaxBounds(accept_datetime=True, default=None, help="""
    The bounds that the range is allowed to go to - typically used to prevent
    the user from panning/zooming/etc away from the data.

    If set to ``'auto'``, the bounds will be computed to the start and end of the Range.

    Bounds are provided as a tuple of ``(min, max)`` so regardless of whether your range is
    increasing or decreasing, the first item should be the minimum value of the range and the
    second item should be the maximum. Setting min > max will result in a ``ValueError``.

    By default, bounds are ``None`` and your plot to pan/zoom as far as you want. If you only
    want to constrain one end of the plot, you can set min or max to None.

    Examples:

        Range1d(0, 1, bounds='auto')  # Auto-bounded to 0 and 1 (Default behavior)
        Range1d(start=0, end=1, bounds=(0, None))  # Maximum is unbounded, minimum bounded to 0
    """)

    min_interval = Either(Float, TimeDelta, Int, default=None, help="""
    The level that the range is allowed to zoom in, expressed as the
    minimum visible interval. If set to ``None`` (default), the minimum
    interval is not bound. Can be a timedelta. """)

    max_interval = Either(Float, TimeDelta, Int, default=None, help="""
    The level that the range is allowed to zoom out, expressed as the
    maximum visible interval. Can be a timedelta. Note that ``bounds`` can
    impose an implicit constraint on the maximum interval as well. """)

    def __init__(self, *args, **kwargs):
        if args and ('start' in kwargs or 'end' in kwargs):
            raise ValueError("'start' and 'end' keywords cannot be used with positional arguments")
        if args and len(args) != 2:
            raise ValueError('Only Range1d(start, end) acceptable when using positional arguments')

        if args:
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
    The upper and lower bounds are set to the min and max of the data.
    """

    range_padding = Float(default=0.1, help="""
    A fraction of the total range size to add as padding to
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

    bounds = MinMaxBounds(accept_datetime=False, default=None, help="""
    The bounds that the range is allowed to go to - typically used to prevent
    the user from panning/zooming/etc away from the data.

    By default, the bounds will be None, allowing your plot to pan/zoom as far as you want.
    If bounds are 'auto' they will be computed to be the same as the start and end of the DataRange1d.

    Bounds are provided as a tuple of ``(min, max)`` so regardless of whether your range is
    increasing or decreasing, the first item should be the minimum value of the range and the
    second item should be the maximum. Setting min > max will result in a ``ValueError``.

    If you only want to constrain one end of the plot, you can set min or max to
    ``None`` e.g. ``DataRange1d(bounds=(None, 12))``
    """)

    min_interval = Float(default=None, help="""
    The level that the range is allowed to zoom in, expressed as the
    minimum visible interval. If set to ``None`` (default), the minimum
    interval is not bound.""")

    max_interval = Float(default=None, help="""
    The level that the range is allowed to zoom out, expressed as the
    maximum visible interval. Note that ``bounds`` can impose an
    implicit constraint on the maximum interval as well.""")

    flipped = Bool(default=False, help="""
    Whether the range should be "flipped" from its normal direction when
    auto-ranging.
    """)

    follow = Enum(StartEnd, default=None, help="""
    Configure the data to follow one or the other data extreme, with a
    maximum range size of ``follow_interval``.

    If set to ``"start"`` then the range will adjust so that ``start`` always
    corresponds to the minimum data value (or maximum, if ``flipped`` is
    ``True``).

    If set to ``"end"`` then the range will adjust so that ``end`` always
    corresponds to the maximum data value (or minimum, if ``flipped`` is
    ``True``).

    If set to ``None`` (default), then auto-ranging does not follow, and
    the range will encompass both the minimum and maximum data values.

    ``follow`` cannot be used with bounds, and if set, bounds will be set to ``None``.
    """)

    follow_interval = Float(default=None, help="""
    If ``follow`` is set to ``"start"`` or ``"end"`` then the range will
    always be constrained to that::

         abs(r.start - r.end) <= follow_interval

    is maintained.

    """)

    default_span = Float(default=2.0, help="""
    A default width for the interval, in case ``start`` is equal to ``end``
    (if used with a log axis, default_span is in powers of 10).
    """)

    def __init__(self, *args, **kwargs):
        if kwargs.get('follow') is not None:
            kwargs['bounds'] = None
        super(DataRange1d, self).__init__(**kwargs)


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

    bounds = Either(Auto, List(String), List(Int), default=None, help="""
    The bounds that the range is allowed to go to - typically used to prevent
    the user from panning/zooming/etc away from the data.

    Unlike Range1d and DataRange1d, factors do not have an order and so a min and max cannot be
    provied in the same way. bounds accepts a list of factors, that constrain the displayed factors.

    By default, bounds are ``None``, allows unlimited panning or zooming.

    If ``bounds='auto'``, bounds will be the same as factors and the plot will not be able to
    pan or zoom beyond the first and last items in factors.

    If you provide a list, then only the factors that are in that list will be displayed on the
    plot and the plot will not pan or zoom outside the first and last items in the shortened
    factors list. Note the order of factors is the defining order for your plot.

    Values of bounds that are not in factors are acceptable and will simply have no impact
    on the plot.

    Examples:

    Auto behavior:
        x_range = FactorRange(factors=["apples", "dogs", "peaches", "bananas", "pigs"], bounds='auto')

        The plot will display all the factors and you will not be able to pan left of apples or right
        of pigs.

    Constraining behavior:
        x_range = FactorRange(factors=["apples", "dogs", "peaches", "bananas", "pigs"], bounds=["apples", "bananas", "peaches"])

        The plot will display the chart with only the factors ["apples", "peaches", "bananas"] (in that order)
        and the plot will not pan left of apples or right of bananas.
    """)

    min_interval = Int(default=None, help="""
    The level that the range is allowed to zoom in, expressed as the
    minimum number of visible categories. If set to ``None`` (default),
    the minimum interval is not bound.""")

    max_interval = Int(default=None, help="""
    The level that the range is allowed to zoom out, expressed as the
    maximum number of visible categories. Note that ``bounds`` can
    impose an implicit constraint on the maximum interval as well.""")

    def __init__(self, *args, **kwargs):
        if args and "factors" in kwargs:
            raise ValueError("'factors' keyword cannot be used with positional arguments")
        elif args:
            kwargs['factors'] = list(args)
        super(FactorRange, self).__init__(**kwargs)
