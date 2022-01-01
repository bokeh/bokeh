#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Models for describing different kinds of ranges of values
in different kinds of spaces (e.g., continuous or categorical)
and with options for "auto sizing".

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from collections import Counter

# Bokeh imports
from ..core.enums import PaddingUnits, StartEnd
from ..core.has_props import abstract
from ..core.properties import (
    Auto,
    Bool,
    Datetime,
    Either,
    Enum,
    FactorSeq,
    Float,
    Instance,
    List,
    MinMaxBounds,
    Null,
    Nullable,
    Readonly,
    String,
    TimeDelta,
)
from ..core.validation import error
from ..core.validation.errors import DUPLICATE_FACTORS
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DataRange',
    'DataRange1d',
    'FactorRange',
    'Range',
    'Range1d',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Range(Model):
    ''' A base class for all range types.

    '''

class Range1d(Range):
    ''' A fixed, closed range [start, end] in a continuous scalar
    dimension.

    In addition to supplying ``start`` and ``end`` keyword arguments
    to the ``Range1d`` initializer, you can also instantiate with
    the convenience syntax::

        Range(0, 10) # equivalent to Range(start=0, end=10)

    '''

    start = Either(Float, Datetime, TimeDelta, default=0, help="""
    The start of the range.
    """)

    end = Either(Float, Datetime, TimeDelta, default=1, help="""
    The end of the range.
    """)

    reset_start = Either(Null, Float, Datetime, TimeDelta, help="""
    The start of the range to apply after reset. If set to ``None`` defaults
    to the ``start`` value during initialization.
    """)

    reset_end = Either(Null, Float, Datetime, TimeDelta, help="""
    The end of the range to apply when resetting. If set to ``None`` defaults
    to the ``end`` value during initialization.
    """)

    bounds = Nullable(MinMaxBounds(accept_datetime=True), help="""
    The bounds that the range is allowed to go to. Typically used to prevent
    the user from panning/zooming/etc away from the data.

    If set to ``'auto'``, the bounds will be computed to the start and end of the Range.

    Bounds are provided as a tuple of ``(min, max)`` so regardless of whether your range is
    increasing or decreasing, the first item should be the minimum value of the range and the
    second item should be the maximum. Setting min > max will result in a ``ValueError``.

    By default, bounds are ``None`` and your plot to pan/zoom as far as you want. If you only
    want to constrain one end of the plot, you can set min or max to None.

    Examples:

    .. code-block:: python

        Range1d(0, 1, bounds='auto')  # Auto-bounded to 0 and 1 (Default behavior)
        Range1d(start=0, end=1, bounds=(0, None))  # Maximum is unbounded, minimum bounded to 0

    """)

    min_interval = Either(Null, Float, TimeDelta, help="""
    The level that the range is allowed to zoom in, expressed as the
    minimum visible interval. If set to ``None`` (default), the minimum
    interval is not bound. Can be a ``TimeDelta``. """)

    max_interval = Either(Null, Float, TimeDelta, help="""
    The level that the range is allowed to zoom out, expressed as the
    maximum visible interval. Can be a ``TimeDelta``. Note that ``bounds`` can
    impose an implicit constraint on the maximum interval as well. """)

    def __init__(self, *args, **kwargs) -> None:
        if args and ('start' in kwargs or 'end' in kwargs):
            raise ValueError("'start' and 'end' keywords cannot be used with positional arguments")
        if args and len(args) != 2:
            raise ValueError('Only Range1d(start, end) acceptable when using positional arguments')

        if args:
            kwargs['start'] = args[0]
            kwargs['end'] = args[1]

        super().__init__(**kwargs)


@abstract
class DataRange(Range):
    ''' A base class for all data range types.

    '''

    names = List(String, help="""
    A list of names to query for. If set, only renderers that
    have a matching value for their ``name`` attribute will be used
    for autoranging.

    .. note:
        This property is deprecated and will be removed in bokeh 3.0.

    """)

    renderers = Either(List(Instance(Model)), Auto, help="""
    An explicit list of renderers to autorange against. If unset,
    defaults to all renderers on a plot.
    """)


class DataRange1d(DataRange):
    ''' An auto-fitting range in a continuous scalar dimension.

    By default the ``start`` and ``end`` of the range automatically
    assume min and max values of the data for associated renderers.

    '''

    range_padding = Either(Float, TimeDelta, default=0.1, help="""
    How much padding to add around the computed data bounds.

    When ``range_padding_units`` is set to ``"percent"``, the span of the
    range span is expanded to make the range ``range_padding`` percent larger.

    When ``range_padding_units`` is set to ``"absolute"``, the start and end
    of the range span are extended by the amount ``range_padding``.
    """)

    range_padding_units = Enum(PaddingUnits, default="percent", help="""
    Whether the ``range_padding`` should be interpreted as a percentage, or
    as an absolute quantity. (default: ``"percent"``)
    """)

    start = Either(Null, Float, Datetime, TimeDelta, help="""
    An explicitly supplied range start. If provided, will override
    automatically computed start value.
    """)

    end = Either(Null, Float, Datetime, TimeDelta, help="""
    An explicitly supplied range end. If provided, will override
    automatically computed end value.
    """)

    bounds = Nullable(MinMaxBounds(accept_datetime=True), help="""
    The bounds that the range is allowed to go to. Typically used to prevent
    the user from panning/zooming/etc away from the data.

    By default, the bounds will be None, allowing your plot to pan/zoom as far
    as you want. If bounds are 'auto' they will be computed to be the same as
    the start and end of the ``DataRange1d``.

    Bounds are provided as a tuple of ``(min, max)`` so regardless of whether
    your range is increasing or decreasing, the first item should be the
    minimum value of the range and the second item should be the maximum.
    Setting ``min > max`` will result in a ``ValueError``.

    If you only want to constrain one end of the plot, you can set ``min`` or
    ``max`` to ``None`` e.g. ``DataRange1d(bounds=(None, 12))``
    """)

    min_interval = Either(Null, Float, TimeDelta, help="""
    The level that the range is allowed to zoom in, expressed as the
    minimum visible interval. If set to ``None`` (default), the minimum
    interval is not bound.""")

    max_interval = Either(Null, Float, TimeDelta, help="""
    The level that the range is allowed to zoom out, expressed as the
    maximum visible interval. Note that ``bounds`` can impose an
    implicit constraint on the maximum interval as well.""")

    flipped = Bool(default=False, help="""
    Whether the range should be "flipped" from its normal direction when
    auto-ranging.
    """)

    follow = Nullable(Enum(StartEnd), help="""
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

    ``follow`` cannot be used with bounds, and if set, bounds will be set to
    ``None``.
    """)

    follow_interval = Nullable(Either(Float, TimeDelta), help="""
    If ``follow`` is set to ``"start"`` or ``"end"`` then the range will
    always be constrained to that::

         abs(r.start - r.end) <= follow_interval

    is maintained.

    """)

    default_span = Either(Float, TimeDelta, default=2.0, help="""
    A default width for the interval, in case ``start`` is equal to ``end``
    (if used with a log axis, default_span is in powers of 10).
    """)

    only_visible = Bool(default=False, help="""
    If True, renderers that that are not visible will be excluded from automatic
    bounds computations.
    """)

    def __init__(self, *args, **kwargs) -> None:
        if kwargs.get('follow') is not None:
            kwargs['bounds'] = None
        super().__init__(**kwargs)


class FactorRange(Range):
    ''' A Range of values for a categorical dimension.

    In addition to supplying ``factors`` as a keyword argument to the
    ``FactorRange`` initializer, you may also instantiate with a sequence of
    positional arguments:

    .. code-block:: python

        FactorRange("foo", "bar") # equivalent to FactorRange(factors=["foo", "bar"])

    Users will normally supply categorical values directly:

    .. code-block:: python

        p.circle(x=["foo", "bar"], ...)

    BokehJS will create a mapping from ``"foo"`` and ``"bar"`` to a numerical
    coordinate system called *synthetic coordinates*. In the simplest cases,
    factors are separated by a distance of 1.0 in synthetic coordinates,
    however the exact mapping from factors to synthetic coordinates is
    affected by he padding properties as well as whether the number of levels
    the factors have.

    Users typically do not need to worry about the details of this mapping,
    however it can be useful to fine tune positions by adding offsets. When
    supplying factors as coordinates or values, it is possible to add an
    offset in the synthetic coordinate space by adding a final number value
    to a factor tuple. For example:

    .. code-block:: python

        p.circle(x=[("foo", 0.3), ...], ...)

    will position the first circle at an ``x`` position that is offset by
    adding 0.3 to the synthetic coordinate for ``"foo"``.

    '''

    factors = FactorSeq(default=[], help="""
    A sequence of factors to define this categorical range.

    Factors may have 1, 2, or 3 levels. For 1-level factors, each factor is
    simply a string. For example:

    .. code-block:: python

        FactorRange(factors=["sales", "marketing", "engineering"])

    defines a range with three simple factors that might represent different
    units of a business.

    For 2- and 3- level factors, each factor is a tuple of strings:

    .. code-block:: python

        FactorRange(factors=[
            ["2016", "sales'], ["2016", "marketing'], ["2016", "engineering"],
            ["2017", "sales'], ["2017", "marketing'], ["2017", "engineering"],
        ])

    defines a range with six 2-level factors that might represent the three
    business units, grouped by year.

    Note that factors and sub-factors *may only be strings*.

    """)

    factor_padding = Float(default=0.0, help="""
    How much padding to add in between all lowest-level factors. When
    ``factor_padding`` is non-zero, every factor in every group will have the
    padding value applied.
    """)

    subgroup_padding = Float(default=0.8, help="""
    How much padding to add in between mid-level groups of factors. This
    property only applies when the overall factors have three levels. For
    example with:

    .. code-block:: python

        FactorRange(factors=[
            ['foo', 'A', '1'],  ['foo', 'A', '2'], ['foo', 'A', '3'],
            ['foo', 'B', '2'],
            ['bar', 'A', '1'],  ['bar', 'A', '2']
        ])

    This property dictates how much padding to add between the three factors
    in the `['foo', 'A']` group, and between the two factors in the the
    [`bar`]
    """)

    group_padding = Float(default=1.4, help="""
    How much padding to add in between top-level groups of factors. This
    property only applies when the overall range factors have either two or
    three levels. For example, with:

    .. code-block:: python

        FactorRange(factors=[["foo", "1'], ["foo", "2'], ["bar", "1"]])

    The top level groups correspond to ``"foo"` and ``"bar"``, and the
    group padding will be applied between the factors ``["foo", "2']`` and
    ``["bar", "1"]``
    """)

    range_padding = Float(default=0, help="""
    How much padding to add around the outside of computed range bounds.

    When ``range_padding_units`` is set to ``"percent"``, the span of the
    range span is expanded to make the range ``range_padding`` percent larger.

    When ``range_padding_units`` is set to ``"absolute"``, the start and end
    of the range span are extended by the amount ``range_padding``.
    """)

    range_padding_units = Enum(PaddingUnits, default="percent", help="""
    Whether the ``range_padding`` should be interpreted as a percentage, or
    as an absolute quantity. (default: ``"percent"``)
    """)

    start = Readonly(Float, help="""
    The start of the range, in synthetic coordinates.

        Synthetic coordinates are only computed in the browser, based on the
        factors and various padding properties. The value of ``start`` will only
        be available in situations where bidirectional communication is
        available (e.g. server, notebook).
    """)

    end = Readonly(Float, help="""
    The end of the range, in synthetic coordinates.

    .. note::
        Synthetic coordinates are only computed in the browser, based on the
        factors and various padding properties. The value of ``end`` will only
        be available in situations where bidirectional communication is
        available (e.g. server, notebook).
    """)

    bounds = Nullable(MinMaxBounds(accept_datetime=False), help="""
    The bounds (in synthetic coordinates) that the range is allowed to go to.
    Typically used to prevent the user from panning/zooming/etc away from the
    data.

    .. note::
        Synthetic coordinates are only computed in the browser, based on the
        factors and various padding properties. Some experimentation may be
        required to arrive at bounds suitable for specific situations.

    By default, the bounds will be None, allowing your plot to pan/zoom as far
    as you want. If bounds are 'auto' they will be computed to be the same as
    the start and end of the ``FactorRange``.
    """)

    min_interval = Nullable(Float, help="""
    The level that the range is allowed to zoom in, expressed as the
    minimum visible interval in synthetic coordinates. If set to ``None``
    (default), the minimum interval is not bounded.

    The default "width" of a category is 1.0 in synthetic coordinates.
    However, the distance between factors is affected by the various
    padding properties and whether or not factors are grouped.
    """)

    max_interval = Nullable(Float, help="""
    The level that the range is allowed to zoom out, expressed as the
    maximum visible interval in synthetic coordinates.. Note that ``bounds``
    can impose an implicit constraint on the maximum interval as well.

    The default "width" of a category is 1.0 in synthetic coordinates.
    However, the distance between factors is affected by the various
    padding properties and whether or not factors are grouped.
    """)

    def __init__(self, *args, **kwargs) -> None:
        if args and "factors" in kwargs:
            raise ValueError("'factors' keyword cannot be used with positional arguments")
        elif args:
            kwargs['factors'] = list(args)
        super().__init__(**kwargs)

    @error(DUPLICATE_FACTORS)
    def _check_duplicate_factors(self):
        dupes = [item for item, count in Counter(self.factors).items() if count > 1]
        if dupes:
            return "duplicate factors found: %s" % ', '.join(repr(x) for x in dupes)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
