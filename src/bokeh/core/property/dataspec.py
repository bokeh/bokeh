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
from copy import copy
from typing import TYPE_CHECKING, Any

# Bokeh imports
from ...util.dataclasses import Unspecified
from ...util.serialization import convert_datetime_type, convert_timedelta_type
from .. import enums
from .any import AnyRef
from .color import ALPHA_DEFAULT_HELP, COLOR_DEFAULT_HELP, Color
from .datetime import Datetime, TimeDelta
from .descriptors import DataSpecPropertyDescriptor
from .either import Either
from .enum import Enum
from .instance import Instance
from .nothing import Nothing
from .nullable import Nullable
from .primitive import (
    Bool,
    Float,
    Int,
    String,
)
from .singletons import Undefined
from .string import Regex
from .struct import Optional, Struct
from .vectorization import (
    DataSpecValue,
    Expr,
    Field,
    Value,
    Vectorized,
)
from .visual import (
    CSS_LENGTH_RE,
    DashPattern,
    FontSize,
    HatchPatternType,
    MarkerType,
)

if TYPE_CHECKING:
    from ...core.has_props import HasProps
    from ...document.events import DocumentPatchedEvent

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AlphaSpec',
    'AngleSpec',
    'BoolSpec',
    'ColorSpec',
    'CoordinateSpec',
    'DashPatternSpec',
    'DataSpec',
    'DistanceSpec',
    'FloatSpec',
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

class DataSpec(Either[Any]):
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

    Alternatively, maybe each glyph that gets drawn should have a
    different location, according to the "pressure" column of a data
    source. In this case we would like to be able to write:

    .. code-block:: python

        glyph.x = "pressure"

    Bokeh ``DataSpec`` properties (and subclasses) afford this ease of
    and consistency of expression. Ultimately, all ``DataSpec`` properties
    resolve to discriminated records. The ``"type"`` key identifies a
    literal value, a data source field, or an expression, and the ``"value"``
    key contains its payload.

    For instance:

    .. code-block:: python

        glyph.x = 10          # => { 'type': 'value', 'value': 10 }

        glyph.x = "pressure"  # => { 'type': 'field', 'value': 'pressure' }

    When these underlying dictionary values are received in
    the browser, BokehJS knows how to interpret them and take the correct,
    expected action (i.e., draw the glyph at ``x=10``, or draw the glyph
    with ``x`` coordinates from the "pressure" column). In this way, both
    use-cases may be expressed easily in python, without having to handle
    anything differently, from the user perspective.

    It is worth noting that ``DataSpec`` properties can also be set directly
    with properly formed dictionary values:

    .. code-block:: python

        glyph.x = { 'type': 'value', 'value': 10 }

        glyph.x = { 'type': 'field', 'value': 'pressure' }

    Setting the property directly as a dict can be useful in certain
    situations. A ``DataSpec`` can have ``"units"`` and ``"transform"``
    modifiers. The latter specifies a client-side transform applied before
    materialization. For example:

    .. code-block:: python

        glyph.x = {
            'type': 'value',
            'value': 10,
            'transform': Jitter(width=0.4),
        }

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

    def __init__(self, value_type: Any, default: Any, *, units: Enum[Any] | None = None, help: str | None = None) -> None:
        self.units_type = units
        self.default_units = units._raw_default() if units is not None else Unspecified
        transform: Optional[Any] = Optional(Instance("bokeh.models.transforms.Transform"))
        expression: Instance[Any] = Instance("bokeh.models.expressions.Expression")

        def spec_struct(spec_type: str, value: Any) -> Struct[Any]:
            fields: dict[str, Any] = {
                "type": Enum(spec_type),
                "value": value,
                "transform": transform,
            }
            if units is not None:
                fields["units"] = Optional(units)
            return Struct(**fields)

        self._spec_structs = (
            spec_struct("value", value_type),
            spec_struct("field", String),
            spec_struct("expr", expression),
        )
        self._value_record_struct = spec_struct("value", AnyRef())

        super().__init__(
            String,
            value_type,
            *self._spec_structs,
            default=default,
            help=help,
        )
        self.value_type = self._validate_type_param(value_type)
        self.accepts(Instance("bokeh.models.expressions.Expression"), lambda obj: Expr(obj))

    def validate(self, value: Any, detail: bool = True) -> None:
        if isinstance(value, DataSpecValue):
            rep = {"type": value.type, "value": value.value}
            if value.transform is not Unspecified:
                rep["transform"] = value.transform
            if value.units is not Unspecified:
                rep["units"] = value.units

            structs = (self._value_record_struct, *self._spec_structs[1:]) if isinstance(value, Value) else self._spec_structs
            if any(struct.is_valid(rep) for struct in structs):
                return

            msg = "" if not detail else f"expected a valid {value.type!r} DataSpec record, got {value!r}"
            raise ValueError(msg)

        super().validate(value, detail)

    def transform(self, value: Any) -> DataSpecValue[Any]:
        result: Any
        if isinstance(value, DataSpecValue):
            result = value
        elif isinstance(value, dict):
            spec_type = value["type"]
            payload = value["value"]
            transform = value.get("transform", Unspecified)
            units = value.get("units", Unspecified)
            if spec_type == "value":
                result = Value(payload, transform, units)
            elif spec_type == "field":
                result = Field(payload, transform, units)
            else:
                result = Expr(payload, transform, units)
        else:
            try:
                self.value_type.replace(String, Nothing()).validate(value, False)
                result = Value(value)
            except ValueError:
                if isinstance(value, str):
                    result = Field(value)
                else:
                    result = value

        if not isinstance(result, DataSpecValue):
            result = super().transform(result)
            if not isinstance(result, DataSpecValue):
                result = Value(result)

        if self.units_type is not None and result.units is Unspecified:
            result = copy(result)
            object.__setattr__(result, "units", self.default_units)

        return result

    def prepare_value(self, owner: HasProps | type[HasProps], name: str, value: Any, *, hint: DocumentPatchedEvent | None = None) -> Any:
        result = super().prepare_value(owner, name, value, hint=hint)

        from ...core.has_props import HasProps
        if isinstance(owner, HasProps) and isinstance(result, DataSpecValue) and result._owners:
            descriptor = owner.lookup(name)
            if (owner, descriptor) not in result._owners:
                result = copy(result)

        return result

    def make_descriptor(self, name: str) -> DataSpecPropertyDescriptor:
        """Return the descriptor used to delegate access to this DataSpec.

        Args:
            name (str) : the name of the property these descriptors are for

        Returns:
            DataSpecPropertyDescriptor
        """
        return DataSpecPropertyDescriptor(name, self)

    def _needs_materialized_default(self) -> bool:
        # DataSpec values are mutable, owner-aware records. Always retain one
        # prepared record per instance so component updates can notify the
        # owning model without sharing state through a class-level default.
        return True

    def to_serializable(self, obj: HasProps, name: str, val: Any) -> Vectorized:
        return val

class BoolSpec(DataSpec):
    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(Bool, default=default, help=help)

class IntSpec(DataSpec):
    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(Int, default=default, help=help)

class FloatSpec(DataSpec):
    def __init__(self, default: Any, *, units: Enum[Any] | None = None, help: str | None = None) -> None:
        super().__init__(Float, default=default, units=units, help=help)

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

    def __init__(self, default: Any = Undefined, *, units: Enum[Any] | None = None, help: str | None = None,
            accept_datetime: bool = True, accept_timedelta: bool = True, _value_type: Any = Float) -> None:
        super().__init__(_value_type, default=default, units=units, help=help)

        if accept_timedelta:
            self.accepts(TimeDelta, convert_timedelta_type)
        else:
            from ...util.deprecation import deprecated

            deprecated((3, 7, 0), "NumberSpec(..., accept_datetime=False)", "FloatSpec()")

        if accept_datetime:
            self.accepts(Datetime, convert_datetime_type)
        else:
            from ...util.deprecation import deprecated

            deprecated((3, 7, 0), "NumberSpec(..., accept_timedelta=False)", "FloatSpec()")

class AlphaSpec(FloatSpec):

    def __init__(self, default: Any = 1.0, *, help: str | None = None) -> None:
        help = f"{help or ''}\n{ALPHA_DEFAULT_HELP}"
        super().__init__(default=default, help=help)

class NullStringSpec(DataSpec):
    def __init__(self, default: Any = None, *, help: str | None = None) -> None:
        super().__init__(Nullable(String), default=default, help=help)

class StringSpec(DataSpec):
    """ A |DataSpec| property that accepts string fixed values.

    Because acceptable fixed values and field names are both strings, it can
    be necessary explicitly to disambiguate these possibilities. By default,
    string values are interpreted as fields, but you can use the |value| function
    to specify that a string is interpreted as a value:

    .. code-block:: python

        m.title = value("foo") # value

        m.title = "foo"        # field

    """
    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(String, default=default, help=help)

class FontSizeSpec(DataSpec):
    """ A |DataSpec| property that accepts font-size fixed values.

    The ``FontSizeSpec`` property attempts to first interpret string values as
    font sizes (i.e. valid CSS length values). Otherwise, string values are
    interpreted as field names. For example:

    .. code-block:: python

        m.font_size = "13px"  # value

        m.font_size = "1.5em" # value

        m.font_size = "foo"   # field

    A full list of all valid CSS length units can be found here:

    https://drafts.csswg.org/css-values/#lengths

    """

    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(FontSize, default=default, help=help)

    def validate(self, value: Any, detail: bool = True) -> None:
        # We want to preserve existing semantics and be a little more restrictive. This
        # validations makes m.font_size = "" or m.font_size = "6" an error
        super().validate(value, detail)

        if isinstance(value, str):
            if len(value) == 0 or (value[0].isdigit() and not CSS_LENGTH_RE.match(value)):
                msg = "" if not detail else f"{value!r} is not a valid font size value"
                raise ValueError(msg)

class FontStyleSpec(DataSpec):
    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(Enum(enums.FontStyle), default=default, help=help)

class TextAlignSpec(DataSpec):
    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(Enum(enums.TextAlign), default=default, help=help)

class TextBaselineSpec(DataSpec):
    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(Enum(enums.TextBaseline), default=default, help=help)

class LineJoinSpec(DataSpec):
    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(Enum(enums.LineJoin), default=default, help=help)

class LineCapSpec(DataSpec):
    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(Enum(enums.LineCap), default=default, help=help)

class DashPatternSpec(DataSpec):
    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(DashPattern, default=default, help=help)

class HatchPatternSpec(DataSpec):
    """ A |DataSpec| property that accepts hatch pattern types as fixed values.

    The ``HatchPatternSpec`` property attempts to first interpret string values
    as hatch pattern types. Otherwise, string values are interpreted as field
    names. For example:

    .. code-block:: python

        m.font_size = "."    # value

        m.font_size = "ring" # value

        m.font_size = "foo"  # field

    """

    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(Nullable(HatchPatternType), default=default, help=help)

class MarkerSpec(DataSpec):
    """ A |DataSpec| property that accepts marker types as fixed values.

    The ``MarkerSpec`` property attempts to first interpret string values as
    marker types. Otherwise, string values are interpreted as field names.
    For example:

    .. code-block:: python

        m.font_size = "circle" # value

        m.font_size = "square" # value

        m.font_size = "foo"    # field

    """

    def __init__(self, default: Any, *, help: str | None = None) -> None:
        super().__init__(Either(MarkerType, Regex("^@.*$")), default=default, help=help)

class AngleSpec(NumberSpec):
    """A |DataSpec| property that accepts numeric values with angle units.

    Acceptable values for units are ``"deg"``, ``"rad"``, ``"grad"`` and ``"turn"``.
    Units are stored directly in the DataSpec value.

    """

    def __init__(self, default: Any = Undefined, *, help: str | None = None,
            accept_datetime: bool = True, accept_timedelta: bool = True) -> None:
        units = Enum(enums.AngleUnits, default="rad")
        super().__init__(default=default, units=units, help=help,
            accept_datetime=accept_datetime, accept_timedelta=accept_timedelta)

class CoordinateSpec(NumberSpec):
    """A |DataSpec| property that accepts numeric values with coordinate units.

    Acceptable values for units are ``"canvas"``, ``"screen"`` and ``"data"``.
    Units are stored directly in the DataSpec value.

    """

    def __init__(self, default: Any = Undefined, *, help: str | None = None,
            accept_datetime: bool = True, accept_timedelta: bool = True) -> None:
        units = Enum(enums.CoordinateUnits, default="data")
        super().__init__(default=default, units=units, help=help,
            accept_datetime=accept_datetime, accept_timedelta=accept_timedelta)

class DistanceSpec(NumberSpec):
    """ A |DataSpec| property that accepts numeric fixed values or strings
    that refer to columns in a :class:`~bokeh.models.sources.ColumnDataSource`.
    Acceptable values for units are ``"screen"`` and ``"data"``.
    Units are stored directly in the DataSpec value.

    """

    def __init__(self, default: Any = Undefined, *, help: str | None = None,
            accept_datetime: bool = True, accept_timedelta: bool = True, _value_type: Any = Float) -> None:
        units = Enum(enums.SpatialUnits, default="data")
        super().__init__(default=default, units=units, help=help,
            accept_datetime=accept_datetime, accept_timedelta=accept_timedelta, _value_type=_value_type)

    def prepare_value(self, owner: HasProps | type[HasProps], name: str, value: Any, *, hint: DocumentPatchedEvent | None = None) -> Any:
        try:
            if value < 0:
                raise ValueError("Distances must be positive!")
        except TypeError:
            pass
        return super().prepare_value(owner, name, value, hint=hint)

class NullDistanceSpec(DistanceSpec):

    def __init__(self, default: Any = None, *, help: str | None = None) -> None:
        super().__init__(default=default, help=help, _value_type=Nullable(Float))

    def prepare_value(self, owner: HasProps | type[HasProps], name: str, value: Any, *, hint: DocumentPatchedEvent | None = None) -> Any:
        try:
            if value is not None and value < 0:
                raise ValueError("Distances must be positive or None!")
        except TypeError:
            pass
        return super().prepare_value(owner, name, value, hint=hint)

class SizeSpec(NumberSpec):
    """ A |DataSpec| property that accepts non-negative numeric fixed values
    for size values or strings that refer to columns in a
    :class:`~bokeh.models.sources.ColumnDataSource`.
    """

    def prepare_value(self, owner: HasProps | type[HasProps], name: str, value: Any, *, hint: DocumentPatchedEvent | None = None) -> Any:
        try:
            if value < 0:
                raise ValueError("Screen sizes must be positive")
        except TypeError:
            pass
        return super().prepare_value(owner, name, value, hint=hint)

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

        m.color = {"type": "field", "value": "firebrick"}

        m.color = field("firebrick")       # field (named "firebrick")

    """

    def __init__(self, default: Any, *, help: str | None = None) -> None:
        help = f"{help or ''}\n{COLOR_DEFAULT_HELP}"
        super().__init__(Nullable(Color), default=default, help=help)

    @classmethod
    def isconst(cls, val: Any) -> bool:
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
    def is_color_tuple_shape(cls, val: Any) -> bool:
        """ Whether the value is the correct shape to be a color tuple

        Checks for a 3 or 4-tuple of numbers

        Args:
            val (str) : the value to check

        Returns:
            True, if the value could be a color tuple

        """
        return isinstance(val, tuple) and len(val) in (3, 4) and all(isinstance(v, (float, int)) for v in val)

    def prepare_value(self, owner: HasProps | type[HasProps], name: str, value: Any, *, hint: DocumentPatchedEvent | None = None) -> Any:
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
        return super().prepare_value(owner, name, value, hint=hint)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
