#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide the DataSpec properties and helpers.

"""

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
from typing import TYPE_CHECKING

# External imports
from typing_extensions import TypedDict

# Bokeh imports
from ... import colors
from ...util.deprecation import deprecated
from ...util.serialization import convert_datetime_type, convert_timedelta_type
from ...util.string import nice_join
from .. import enums
from .color import Color
from .container import Dict, List
from .datetime import Datetime, TimeDelta
from .descriptors import DataSpecPropertyDescriptor, UnitsSpecPropertyDescriptor
from .either import Either
from .enum import Enum
from .instance import Instance
from .nullable import Nullable
from .primitive import (
    Float,
    Int,
    Null,
    String,
)
from .singletons import Undefined
from .visual import (
    DashPattern,
    FontSize,
    HatchPatternType,
    MarkerType,
)

if TYPE_CHECKING:
    from ...core.types import Unknown
    from ...models.expressions import Expression
    from ...models.transforms import Transform

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AlphaSpec',
    'AngleSpec',
    'ColorSpec',
    'DashPatternSpec',
    'DataSpec',
    'DistanceSpec',
    'expr',
    'field',
    'FontSizeSpec',
    'FontStyleSpec',
    'HatchPatternSpec',
    'IntSpec',
    'LineCapSpec',
    'LineJoinSpec',
    'MarkerSpec',
    'NumberSpec',
    'SizeSpec',
    'StringSpec',
    'TextAlignSpec',
    'TextBaselineSpec',
    'value',
)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_ExprFieldValueTransform = Enum("expr", "field", "value", "transform")

_ExprFieldValueTransformUnits = Enum("expr", "field", "value", "transform", "units")

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class DataSpec(Either):
    """ Base class for properties that accept either a fixed value, or a
    string name that references a column in a
    :class:`~bokeh.models.sources.ColumnDataSource`.

    Many Bokeh models have properties that a user might want to set either
    to a single fixed value, or to have the property take values from some
    column in a data source. As a concrete example consider a glyph with
    an ``x`` property for location. We might want to set all the glyphs
    that get drawn to have the same location, say ``x=10``. It would be
    convenient to  just be able to write:

    .. code-block:: python

        glyph.x = 10

    Alternatively, maybe the each glyph that gets drawn should have a
    different location, according to the "pressure" column of a data
    source. In this case we would like to be able to write:

    .. code-block:: python

        glyph.x = "pressure"

    Bokeh ``DataSpec`` properties (and subclasses) afford this ease of
    and consistency of expression. Ultimately, all ``DataSpec`` properties
    resolve to dictionary values, with either a ``"value"`` key, or a
    ``"field"`` key, depending on how it is set.

    For instance:

    .. code-block:: python

        glyph.x = 10          # => { 'value': 10 }

        glyph.x = "pressure"  # => { 'field': 'pressure' }

    When these underlying dictionary dictionary values are received in
    the browser, BokehJS knows how to interpret them and take the correct,
    expected action (i.e., draw the glyph at ``x=10``, or draw the glyph
    with ``x`` coordinates from the "pressure" column). In this way, both
    use-cases may be expressed easily in python, without having to handle
    anything differently, from the user perspective.

    It is worth noting that ``DataSpec`` properties can also be set directly
    with properly formed dictionary values:

    .. code-block:: python

        glyph.x = { 'value': 10 }         # same as glyph.x = 10

        glyph.x = { 'field': 'pressure' } # same as glyph.x = "pressure"

    Setting the property directly as a dict can be useful in certain
    situations. For instance some ``DataSpec`` subclasses also add a
    ``"units"`` key to the dictionary. This key is often set automatically,
    but the dictionary format provides a direct mechanism to override as
    necessary. Additionally, ``DataSpec`` can have a ``"transform"`` key,
    that specifies a client-side transform that should be applied to any
    fixed or field values before they are uses. As an example, you might want
    to apply a ``Jitter`` transform to the ``x`` values:

    .. code-block:: python

        glyph.x = { 'value': 10, 'transform': Jitter(width=0.4) }

    Note that ``DataSpec`` is not normally useful on its own. Typically,
    a model will define properties using one of the subclasses such
    as :class:`~bokeh.core.properties.NumberSpec` or
    :class:`~bokeh.core.properties.ColorSpec`. For example, a Bokeh
    model with ``x``, ``y`` and ``color`` properties that can handle
    fixed values or columns automatically might look like:

    .. code-block:: python

        class SomeModel(Model):

            x = NumberSpec(default=0, help="docs for x")

            y = NumberSpec(default=0, help="docs for y")

            color = ColorSpec(help="docs for color") # defaults to None

    """
    def __init__(self, key_type, value_type, default, help=None) -> None:
        super().__init__(
            String,
            Dict(
                key_type,
                Either(
                    String,
                    Instance('bokeh.models.transforms.Transform'),
                    Instance('bokeh.models.expressions.Expression'),
                    value_type)),
            value_type,
            default=default,
            help=help
        )
        self._type = self._validate_type_param(value_type)
        self.accepts(Instance("bokeh.models.expressions.Expression"), lambda obj: expr(obj))

    # TODO (bev) add stricter validation on keys

    def make_descriptors(self, base_name):
        """ Return a list of ``DataSpecPropertyDescriptor`` instances to
        install on a class, in order to delegate attribute access to this
        property.

        Args:
            base_name (str) : the name of the property these descriptors are for

        Returns:
            list[DataSpecPropertyDescriptor]

        The descriptors returned are collected by the ``MetaHasProps``
        metaclass and added to ``HasProps`` subclasses during class creation.
        """
        return [ DataSpecPropertyDescriptor(base_name, self) ]

    def to_serializable(self, obj, name, val):
        # Check for spec type value
        try:
            self._type.validate(val, False)
            return dict(value=val)
        except ValueError:
            pass

        # Check for data source field name
        if isinstance(val, str):
            return dict(field=val)

        # Must be dict, return a new dict
        return dict(val)

class IntSpec(DataSpec):
    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, Int, default=default, help=help)

class NumberSpec(DataSpec):
    """ A |DataSpec| property that accepts numeric and datetime fixed values.

    By default, date and datetime values are immediately converted to
    milliseconds since epoch. It is possible to disable processing of datetime
    values by passing ``accept_datetime=False``.

    By default, timedelta values are immediately converted to absolute
    milliseconds.  It is possible to disable processing of timedelta
    values by passing ``accept_timedelta=False``

    Timedelta values are interpreted as absolute milliseconds.

    .. code-block:: python

        m.location = 10.3  # value

        m.location = "foo" # field

    """
    def __init__(self, default=Undefined, help=None, key_type=_ExprFieldValueTransform, accept_datetime=True, accept_timedelta=True) -> None:
        super().__init__(key_type, Float, default=default, help=help)
        if accept_timedelta:
            self.accepts(TimeDelta, convert_timedelta_type)
        if accept_datetime:
            self.accepts(Datetime, convert_datetime_type)

class AlphaSpec(NumberSpec):

    _default_help = """\
    Acceptable values are numbers in 0..1 range (transparent..opaque).
    """

    def __init__(self, default=1.0, help=None) -> None:
        help = f"{help or ''}\n{self._default_help}"
        super().__init__(default=default, help=help, key_type=_ExprFieldValueTransform, accept_datetime=False, accept_timedelta=False)

class NullStringSpec(DataSpec):
    def __init__(self, default=None, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, Nullable(List(String)), default=default, help=help)

class StringSpec(DataSpec):
    """ A |DataSpec| property that accepts string fixed values.

    Because acceptable fixed values and field names are both strings, it can
    be necessary explicitly to disambiguate these possibilities. By default,
    string values are interpreted as fields, but the |value| function can be
    used to specify that a string should interpreted as a value:

    .. code-block:: python

        m.title = value("foo") # value

        m.title = "foo"        # field

    """
    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, List(String), default=default, help=help)

    def prepare_value(self, cls, name, value):
        if isinstance(value, list):
            if len(value) != 1:
                raise TypeError("StringSpec convenience list values must have length 1")
            value = dict(value=value[0])
        return super().prepare_value(cls, name, value)

class FontSizeSpec(DataSpec):
    """ A |DataSpec| property that accepts font-size fixed values.

    The ``FontSizeSpec`` property attempts to first interpret string values as
    font sizes (i.e. valid CSS length values). Otherwise string values are
    interpreted as field names. For example:

    .. code-block:: python

        m.font_size = "13px"  # value

        m.font_size = "1.5em" # value

        m.font_size = "foo"   # field

    A full list of all valid CSS length units can be found here:

    https://drafts.csswg.org/css-values/#lengths

    """

    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, FontSize, default=default, help=help)

    def validate(self, value, detail=True):
        # We want to preserve existing semantics and be a little more restrictive. This
        # validations makes m.font_size = "" or m.font_size = "6" an error
        super().validate(value, detail)

        if isinstance(value, str):
            if len(value) == 0 or value[0].isdigit() and not FontSize._font_size_re.match(value):
                msg = "" if not detail else f"{value!r} is not a valid font size value"
                raise ValueError(msg)

class FontStyleSpec(DataSpec):
    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, Enum(enums.FontStyle), default=default, help=help)

class TextAlignSpec(DataSpec):
    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, Enum(enums.TextAlign), default=default, help=help)

class TextBaselineSpec(DataSpec):
    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, Enum(enums.TextBaseline), default=default, help=help)

class LineJoinSpec(DataSpec):
    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, Enum(enums.LineJoin), default=default, help=help)

class LineCapSpec(DataSpec):
    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, Enum(enums.LineCap), default=default, help=help)

class DashPatternSpec(DataSpec):
    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, DashPattern, default=default, help=help)

class HatchPatternSpec(DataSpec):
    """ A |DataSpec| property that accepts hatch pattern types as fixed values.

    The ``HatchPatternSpec`` property attempts to first interpret string values
    as hatch pattern types. Otherwise string values are interpreted as field
    names. For example:

    .. code-block:: python

        m.font_size = "."    # value

        m.font_size = "ring" # value

        m.font_size = "foo"  # field

    """

    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, Nullable(HatchPatternType), default=default, help=help)

class MarkerSpec(DataSpec):
    """ A |DataSpec| property that accepts marker types as fixed values.

    The ``MarkerSpec`` property attempts to first interpret string values as
    marker types. Otherwise string values are interpreted as field names.
    For example:

    .. code-block:: python

        m.font_size = "circle" # value

        m.font_size = "square" # value

        m.font_size = "foo"    # field

    """

    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        super().__init__(key_type, MarkerType, default=default, help=help)

class UnitsSpec(NumberSpec):
    """ A |DataSpec| property that accepts numeric fixed values, and also
    provides an associated units property to store units information.

    """

    def __init__(self, default, units_enum, units_default, help=None) -> None:
        super().__init__(default=default, help=help, key_type=_ExprFieldValueTransformUnits)
        units_type = Enum(units_enum, default=units_default, serialized=False, help=f"""
        Units to use for the associated property: {nice_join(units_enum)}
        """)
        self._units_type = self._validate_type_param(units_type, help_allowed=True)

    def __str__(self) -> str:
        units_default = self._units_type._default
        return f"{self.__class__.__name__}(units_default={units_default!r})"

    def get_units(self, obj, name):
        return getattr(obj, name+"_units")

    def make_descriptors(self, base_name):
        """ Return a list of ``PropertyDescriptor`` instances to install on a
        class, in order to delegate attribute access to this property.

        Unlike simpler property types, ``PropertyUnitsSpec`` returns multiple
        descriptors to install. In particular, descriptors for the base
        property as well as the associated units property are returned.

        Args:
            name (str) : the name of the property these descriptors are for

        Returns:
            list[PropertyDescriptor]

        The descriptors returned are collected by the ``MetaHasProps``
        metaclass and added to ``HasProps`` subclasses during class creation.
        """
        units_name = base_name + "_units"
        units_props = self._units_type.make_descriptors(units_name)
        return units_props + [ UnitsSpecPropertyDescriptor(base_name, self, units_props[0]) ]

    def to_serializable(self, obj, name, val):
        d = super().to_serializable(obj, name, val)
        if d is not None and 'units' not in d:
            # d is a PropertyValueDict at this point, we need to convert it to
            # a plain dict if we are going to modify its value, otherwise a
            # notify_change that should not happen will be triggered
            units = self.get_units(obj, name)
            if units != self._units_type._default:
                d = dict(**d, units=units)
        return d

# Deprecated
class PropertyUnitsSpec(UnitsSpec):
    pass

class AngleSpec(PropertyUnitsSpec):
    """ A |DataSpec| property that accepts numeric fixed values, and also
    provides an associated units property to store angle units.

    Acceptable values for units are ``"deg"``, ``"rad"``, ``"grad"`` and ``"turn"``.

    """
    def __init__(self, default=Undefined, units_default="rad", help=None) -> None:
        super().__init__(default=default, units_enum=enums.AngleUnits, units_default=units_default, help=help)

class DistanceSpec(PropertyUnitsSpec):
    """ A |DataSpec| property that accepts numeric fixed values or strings
    that refer to columns in a :class:`~bokeh.models.sources.ColumnDataSource`,
    and also provides an associated units property to store units information.
    Acceptable values for units are ``"screen"`` and ``"data"``.

    """
    def __init__(self, default=Undefined, units_default="data", help=None) -> None:
        super().__init__(default=default, units_enum=enums.SpatialUnits, units_default=units_default, help=help)

    def prepare_value(self, cls, name, value):
        try:
            if value < 0:
                raise ValueError("Distances must be positive!")
        except TypeError:
            pass
        return super().prepare_value(cls, name, value)

class NullDistanceSpec(DistanceSpec):

    def __init__(self, default=None, units_default="data", help=None) -> None:
        super().__init__(default=default, units_default=units_default, help=help)
        self._type = Nullable(self._type)
        self._type_params = [Null()] + self._type_params

    def prepare_value(self, cls, name, value):
        try:
            if value is not None and value < 0:
                raise ValueError("Distances must be positive or None!")
        except TypeError:
            pass
        return super().prepare_value(cls, name, value)

class SizeSpec(NumberSpec):
    """ A |DataSpec| property that accepts non-negative numeric fixed values
    for size values or strings that refer to columns in a
    :class:`~bokeh.models.sources.ColumnDataSource`.
    """

    def prepare_value(self, cls, name, value):
        try:
            if value < 0:
                raise ValueError("Screen sizes must be positive")
        except TypeError:
            pass
        return super().prepare_value(cls, name, value)

class ColorSpec(DataSpec):
    """ A |DataSpec| property that accepts |Color| fixed values.

    The ``ColorSpec`` property attempts to first interpret string values as
    colors. Otherwise, string values are interpreted as field names. For
    example:

    .. code-block:: python

        m.color = "#a4225f"   # value (hex color string)

        m.color = "firebrick" # value (named CSS color string)

        m.color = "foo"       # field (named "foo")

    This automatic interpretation can be override using the dict format
    directly, or by using the |field| function:

    .. code-block:: python

        m.color = { "field": "firebrick" } # field (named "firebrick")

        m.color = field("firebrick")       # field (named "firebrick")

    """

    _default_help = """\
    Acceptable values are:

    - any of the |named CSS colors|, e.g ``'green'``, ``'indigo'``
    - RGB(A) hex strings, e.g., ``'#FF0000'``, ``'#44444444'``
    - CSS4 color strings, e.g., ``'rgba(255, 0, 127, 0.6)'``, ``'rgb(0 127 0 / 1.0)'``
    - a 3-tuple of integers (r, g, b) between 0 and 255
    - a 4-tuple of (r, g, b, a) where r, g, b are integers between 0..255 and a is between 0..1
    - a 32-bit unsiged integers using the 0xRRGGBBAA byte order pattern

    """

    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform) -> None:
        help = f"{help or ''}\n{self._default_help}"
        super().__init__(key_type, Nullable(Color), default=default, help=help)

    @classmethod
    def isconst(cls, val):
        """ Whether the value is a string color literal.

        Checks for a well-formed hexadecimal color value or a named color.

        Args:
            val (str) : the value to check

        Returns:
            True, if the value is a string color literal

        """
        return isinstance(val, str) and \
               ((len(val) == 7 and val[0] == "#") or val in enums.NamedColor)

    @classmethod
    def is_color_tuple_shape(cls, val):
        """ Whether the value is the correct shape to be a color tuple

        Checks for a 3 or 4-tuple of numbers

        Args:
            val (str) : the value to check

        Returns:
            True, if the value could be a color tuple

        """
        return isinstance(val, tuple) and len(val) in (3, 4) and all(isinstance(v, (float, int)) for v in val)

    def to_serializable(self, obj, name, val):
        if val is None:
            return dict(value=None)

        # Check for hexadecimal or named color
        if self.isconst(val):
            return dict(value=val)

        # Check for RGB or RGBA tuple
        if isinstance(val, tuple):
            return dict(value=colors.RGB(*val).to_css())

        # Check for data source field name
        if isinstance(val, colors.RGB):
            return val.to_css()

        # Check for data source field name or rgb(a) string
        if isinstance(val, str):
            if val.startswith(("rgb(", "rgba(")):
                return val

            return dict(field=val)

        # Must be dict, return new dict
        return dict(val)

    def prepare_value(self, cls, name, value):
        # Some explanation is in order. We want to accept tuples like
        # (12.0, 100.0, 52.0) i.e. that have "float" byte values. The
        # ColorSpec has a transform to adapt values like this to tuples
        # of integers, but Property validation happens before the
        # transform step, so values like that will fail Color validation
        # at this point, since Color is very strict about only accepting
        # tuples of (integer) bytes. This conditions tuple values to only
        # have integer RGB components
        if self.is_color_tuple_shape(value):
            value = tuple(int(v) if i < 3 else v for i, v in enumerate(value))
        return super().prepare_value(cls, name, value)

# DataSpec helpers ------------------------------------------------------------

class Expr(TypedDict, total=False):
    expr: Expression
    transform: Transform | None

class Field(TypedDict, total=False):
    field: str
    transform: Transform | None

class Value(TypedDict, total=False):
    value: Unknown
    transform: Transform | None

def expr(expression: Expression, transform: Transform | None = None) -> Expr:
    """ Convenience function to explicitly return an "expr" specification for
    a Bokeh |DataSpec| property.

    Args:
        expression (Expression) : a computed expression for a
            ``DataSpec`` property.

        transform (Transform, optional) : a transform to apply (default: None)

    Returns:
        dict : ``{ "expr": expression }``

    .. note::
        This function is included for completeness. String values for
        property specifications are by default interpreted as field names.

    """
    if transform:
        return Expr(expr=expression, transform=transform)
    return Expr(expr=expression)

def field(name: str, transform: Transform | None = None) -> Field:
    """ Convenience function to explicitly return a "field" specification for
    a Bokeh |DataSpec| property.

    Args:
        name (str) : name of a data source field to reference for a
            ``DataSpec`` property.

        transform (Transform, optional) : a transform to apply (default: None)

    Returns:
        dict : ``{ "field": name }``

    .. note::
        This function is included for completeness. String values for
        property specifications are by default interpreted as field names.

    """
    if transform:
        return Field(field=name, transform=transform)
    return Field(field=name)

def value(val: Unknown, transform: Transform | None = None) -> Value:
    """ Convenience function to explicitly return a "value" specification for
    a Bokeh |DataSpec| property.

    Args:
        val (any) : a fixed value to specify for a ``DataSpec`` property.

        transform (Transform, optional) : a transform to apply (default: None)

    Returns:
        dict : ``{ "value": name }``

    .. note::
        String values for property specifications are by default interpreted
        as field names. This function is especially useful when you want to
        specify a fixed value with text properties.

    Example:

        .. code-block:: python

            # The following will take text values to render from a data source
            # column "text_column", but use a fixed value "16px" for font size
            p.text("x", "y", text="text_column",
                   text_font_size=value("16px"), source=source)

    """
    if transform:
        return Value(value=val, transform=transform)
    return Value(value=val)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def DataDistanceSpec(*args, **kw):
    deprecated((2, 4, 0), "DataDistanceSpec()", "SizeSpec()")
    return SizeSpec(*args, **kw)

def ScreenDistanceSpec(*args, **kw):
    deprecated((2, 4, 0), "DataDistanceSpec()", "SizeSpec()")
    return SizeSpec(*args, **kw)


#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
