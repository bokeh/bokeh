#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ...util.dataclasses import Unspecified
from ...util.serialization import convert_datetime_type, convert_timedelta_type
from ...util.strings import nice_join
from .. import enums
from .color import ALPHA_DEFAULT_HELP, COLOR_DEFAULT_HELP, Color
from .datetime import Datetime, TimeDelta
from .descriptors import DataSpecPropertyDescriptor, UnitsSpecPropertyDescriptor
from .either import Either
from .enum import Enum
from .instance import Instance
from .nothing import Nothing
from .nullable import Nullable
from .primitive import (
    Float,
    Int,
    Null,
    String,
)
from .serialized import NotSerialized
from .singletons import Undefined
from .struct import Optional, Struct
from .vectorization import (
    Expr,
    Field,
    Value,
    Vectorized,
)
from .visual import (
    DashPattern,
    FontSize,
    HatchPatternType,
    MarkerType,
)

if TYPE_CHECKING:
    from ...core.has_props import HasProps

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
)

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

    def __init__(self, value_type, default, *, help: str | None = None) -> None:
        super().__init__(
            String,
            value_type,
            Instance(Value),
            Instance(Field),
            Instance(Expr),
            Struct(
                value=value_type,
                transform=Optional(Instance("bokeh.models.transforms.Transform")),
            ),
            Struct(
                field=String,
                transform=Optional(Instance("bokeh.models.transforms.Transform")),
            ),
            Struct(
                expr=Instance("bokeh.models.expressions.Expression"),
                transform=Optional(Instance("bokeh.models.transforms.Transform")),
            ),
            default=default,
            help=help,
        )
        self.value_type = self._validate_type_param(value_type)
        self.accepts(Instance("bokeh.models.expressions.Expression"), lambda obj: Expr(obj))

    def transform(self, value: Any):
        if isinstance(value, dict):
            if "value" in value:
                return Value(**value)
            if "field" in value:
                return Field(**value)
            if "expr" in value:
                return Expr(**value)

        return super().transform(value)

    def make_descriptors(self, base_name: str):
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

    def to_serializable(self, obj: HasProps, name: str, val: Any) -> Vectorized:
        # Check for spec type value
        try:
            self.value_type.replace(String, Nothing()).validate(val, False)
            return Value(val)
        except ValueError:
            pass

        # Check for data source field name
        if isinstance(val, str):
            return Field(val)

        return val

class IntSpec(DataSpec):
    def __init__(self, default, *, help: str | None = None) -> None:
        super().__init__(Int, default=default, help=help)

class NumberSpec(DataSpec):
    """ A |DataSpec| property that accepts numeric and datetime fixed values.

    By default, date and datetime values are immediately converted to
    milliseconds since epoch. It is possible to disable processing of datetime
    values by passing ``accept_datetime=False``.

    By default, timedelta values are immediately converted to absolute
    milliseconds. It is possible to disable processing of timedelta
    values by passing ``accept_timedelta=False``

    Timedelta values are interpreted as absolute milliseconds.

    .. code-block:: python

        m.location = 10.3  # value

        m.location = "foo" # field

    """

    def __init__(self, default=Undefined, *, help: str | None = None, accept_datetime=True, accept_timedelta=True) -> None:
        super().__init__(Float, default=default, help=help)
        if accept_timedelta:
            self.accepts(TimeDelta, convert_timedelta_type)
        if accept_datetime:
            self.accepts(Datetime, convert_datetime_type)

class AlphaSpec(NumberSpec):

    def __init__(self, default=1.0, *, help: str | None = None) -> None:
        help = f"{help or ''}\n{ALPHA_DEFAULT_HELP}"
        super().__init__(default=default, help=help, accept_datetime=False, accept_timedelta=False)

class NullStringSpec(DataSpec):
    def __init__(self, default=None, *, help: str | None = None) -> None:
        super().__init__(Nullable(String), default=default, help=help)

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
    def __init__(self, default, *, help: str | None = None) -> None:
        super().__init__(String, default=default, help=help)

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

    def __init__(self, default, *, help: str | None = None) -> None:
        super().__init__(FontSize, default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        # We want to preserve existing semantics and be a little more restrictive. This
        # validations makes m.font_size = "" or m.font_size = "6" an error
        super().validate(value, detail)

        if isinstance(value, str):
            if len(value) == 0 or value[0].isdigit() and not FontSize._font_size_re.match(value):
                msg = "" if not detail else f"{value!r} is not a valid font size value"
                raise ValueError(msg)

class FontStyleSpec(DataSpec):
    def __init__(self, default, *, help: str | None = None) -> None:
        super().__init__(Enum(enums.FontStyle), default=default, help=help)

class TextAlignSpec(DataSpec):
    def __init__(self, default, *, help: str | None = None) -> None:
        super().__init__(Enum(enums.TextAlign), default=default, help=help)

class TextBaselineSpec(DataSpec):
    def __init__(self, default, *, help: str | None = None) -> None:
        super().__init__(Enum(enums.TextBaseline), default=default, help=help)

class LineJoinSpec(DataSpec):
    def __init__(self, default, *, help: str | None = None) -> None:
        super().__init__(Enum(enums.LineJoin), default=default, help=help)

class LineCapSpec(DataSpec):
    def __init__(self, default, *, help: str | None = None) -> None:
        super().__init__(Enum(enums.LineCap), default=default, help=help)

class DashPatternSpec(DataSpec):
    def __init__(self, default, *, help: str | None = None) -> None:
        super().__init__(DashPattern, default=default, help=help)

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

    def __init__(self, default, *, help: str | None = None) -> None:
        super().__init__(Nullable(HatchPatternType), default=default, help=help)

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

    def __init__(self, default, *, help: str | None = None) -> None:
        super().__init__(MarkerType, default=default, help=help)

class UnitsSpec(NumberSpec):
    """ A |DataSpec| property that accepts numeric fixed values, and also
    provides an associated units property to store units information.

    """

    def __init__(self, default, units_enum, units_default, *, help: str | None = None) -> None:
        super().__init__(default=default, help=help)

        units_type = NotSerialized(Enum(units_enum), default=units_default, help=f"""
        Units to use for the associated property: {nice_join(units_enum)}
        """)
        self._units_type = self._validate_type_param(units_type, help_allowed=True)

        self._type_params += [
            Struct(
                value=self.value_type,
                transform=Optional(Instance("bokeh.models.transforms.Transform")),
                units=Optional(units_type),
            ),
            Struct(
                field=String,
                transform=Optional(Instance("bokeh.models.transforms.Transform")),
                units=Optional(units_type),
            ),
            Struct(
                expr=Instance("bokeh.models.expressions.Expression"),
                transform=Optional(Instance("bokeh.models.transforms.Transform")),
                units=Optional(units_type),
            ),
        ]

    def __str__(self) -> str:
        units_default = self._units_type._default
        return f"{self.__class__.__name__}(units_default={units_default!r})"

    def get_units(self, obj: HasProps, name: str) -> str:
        return getattr(obj, name + "_units")

    def make_descriptors(self, base_name: str):
        """ Return a list of ``PropertyDescriptor`` instances to install on a
        class, in order to delegate attribute access to this property.

        Unlike simpler property types, ``UnitsSpec`` returns multiple
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
        return [*units_props, UnitsSpecPropertyDescriptor(base_name, self, units_props[0])]

    def to_serializable(self, obj: HasProps, name: str, val: Any) -> Vectorized:
        val = super().to_serializable(obj, name, val)
        if val.units is Unspecified:
            units = self.get_units(obj, name)
            if units != self._units_type._default:
                val.units = units # XXX: clone and update?
        return val

class AngleSpec(UnitsSpec):
    """ A |DataSpec| property that accepts numeric fixed values, and also
    provides an associated units property to store angle units.

    Acceptable values for units are ``"deg"``, ``"rad"``, ``"grad"`` and ``"turn"``.

    """
    def __init__(self, default=Undefined, units_default="rad", *, help: str | None = None) -> None:
        super().__init__(default=default, units_enum=enums.AngleUnits, units_default=units_default, help=help)

class DistanceSpec(UnitsSpec):
    """ A |DataSpec| property that accepts numeric fixed values or strings
    that refer to columns in a :class:`~bokeh.models.sources.ColumnDataSource`,
    and also provides an associated units property to store units information.
    Acceptable values for units are ``"screen"`` and ``"data"``.

    """
    def __init__(self, default=Undefined, units_default="data", *, help: str | None = None) -> None:
        super().__init__(default=default, units_enum=enums.SpatialUnits, units_default=units_default, help=help)

    def prepare_value(self, cls, name, value):
        try:
            if value < 0:
                raise ValueError("Distances must be positive!")
        except TypeError:
            pass
        return super().prepare_value(cls, name, value)

class NullDistanceSpec(DistanceSpec):

    def __init__(self, default=None, units_default="data", *, help: str | None = None) -> None:
        super().__init__(default=default, units_default=units_default, help=help)
        self.value_type = Nullable(Float)
        self._type_params = [Null(), *self._type_params]

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

    def __init__(self, default, *, help: str | None = None) -> None:
        help = f"{help or ''}\n{COLOR_DEFAULT_HELP}"
        super().__init__(Nullable(Color), default=default, help=help)

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

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
