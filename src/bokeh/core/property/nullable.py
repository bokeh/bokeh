#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide ``Nullable`` property. """

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

from typing import TYPE_CHECKING, Any

from ._sphinx import register_type_link, type_link
from .bases import SingleParameterizedProperty
from .exceptions import PropertyError, ValidationError
from .singletons import Undefined, _NotGiven

if TYPE_CHECKING:
    from ...document.events import DocumentPatchedEvent
    from ..has_props import HasProps
    from .bases import Init, Property, TypeOrInst
    from .dataspec import DataSpec
    from .descriptors import DataSpecPropertyDescriptor
    from .vectorization import Vectorized

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    "Nullable",
    "NullableProp",
    "NullableSpec",
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class Nullable[T](SingleParameterizedProperty[T | None]):
    """ A property accepting ``None`` or a value of some other type.

    Wrapping a |DataSpec| makes its values nullable, including literal values,
    source column entries and expression results. Field and expression specs
    and transforms retain their usual meaning. For example:

    .. code-block:: python

        angle = Nullable(AngleSpec)
        angle_units = AngleUnits

    ``None`` remains ``null`` during JavaScript materialization, including
    unit conversion. Transforms receive nullable input and are responsible
    for handling it. The consuming model defines what a null value means.

    Construction returns a ``NullableProp`` for ordinary properties or a
    ``NullableSpec`` for DataSpecs. Both derive from ``Nullable``, preserving
    ``isinstance(prop, Nullable)`` checks and ``Nullable[T]`` annotations.

    Already-nullable specs such as ``ColorSpec`` retain their existing null
    representation, including transparent color encoding in BokehJS.
    """

    def __new__(cls, type_param: TypeOrInst[Property[T]] | None = None, *, default: Init[T | None] = None, help: str | None = None) -> Nullable[T]:
        if cls is Nullable:
            implementation = NullableSpec if cls._is_dataspec(type_param) else NullableProp
            return object.__new__(implementation)
        return object.__new__(cls)

    @staticmethod
    def _is_dataspec(type_param: Any) -> bool:
        from .dataspec import DataSpec
        if isinstance(type_param, type):
            return issubclass(type_param, (DataSpec, NullableSpec))
        return isinstance(type_param, (DataSpec, NullableSpec))

    def __init__(self, type_param: TypeOrInst[Property[T]], *, default: Init[T | None] = None, help: str | None = None) -> None:
        super().__init__(type_param, default=default, help=help)

    def __str__(self) -> str:
        return f"Nullable({self.type_param})"

    def replace(self, old: type[Property[Any]], new: Property[Any]) -> Property[Any]:
        if old is Nullable or old is type(self):
            return new
        return Nullable(self.type_param.replace(old, new))


class NullableProp[T](Nullable[T]):
    """ A nullable wrapper for ordinary properties.

    Use ``Nullable(type_param)`` to select the appropriate wrapper automatically.
    Direct construction requires an ordinary property. Instances also satisfy
    ``isinstance(prop, Nullable)``.
    """

    def __init__(self, type_param: TypeOrInst[Property[T]], *, default: Init[T | None] = None, help: str | None = None) -> None:
        if self._is_dataspec(type_param):
            raise TypeError("NullableProp requires an ordinary property. Use Nullable(...) for DataSpecs")
        super().__init__(type_param, default=default, help=help)

    def transform(self, value: Any) -> T | None:
        return None if value is None else super().transform(value)

    def wrap(self, value: Any) -> Any:
        return None if value is None else super().wrap(value)

    def validate(self, value: Any, detail: bool = True) -> None:
        if value is None:
            return

        try:
            super().validate(value, detail=False)
        except PropertyError:
            pass
        else:
            return

        msg = "" if not detail else f"expected either None or a value of type {self.type_param}, got {value!r}"
        raise ValidationError(msg)


class NullableSpec[T](Nullable[T]):
    """ A nullable wrapper preserving a DataSpec's specialized behavior.

    Use ``Nullable(spec)`` to select the appropriate wrapper automatically.
    Direct construction requires a DataSpec. Instances also satisfy
    ``isinstance(prop, Nullable)``.
    """

    _dataspec: DataSpec

    def __init__(self, type_param: TypeOrInst[Property[T]], *, default: Init[T | None] = None, help: str | None = None) -> None:
        super().__init__(type_param, default=default, help=help)
        from .dataspec import DataSpec
        spec = self.type_param._dataspec if isinstance(self.type_param, NullableSpec) else self.type_param
        if not isinstance(spec, DataSpec):
            raise TypeError("NullableSpec requires a DataSpec. Use Nullable(...) for ordinary properties")
        self._dataspec = spec._make_nullable()
        self._dataspec._default = default
        self._dataspec._help = self._help
        self._dataspec.__doc__ = self.__doc__
        self.alternatives.extend(self._dataspec.alternatives)
        self.assertions.extend(self._dataspec.assertions)

    @staticmethod
    def _validate_type_param(type_param: Any, *, help_allowed: bool = False, default: Init[Any] = _NotGiven) -> Property[Any]:
        from .dataspec import DataSpec
        if isinstance(type_param, type) and issubclass(type_param, DataSpec):
            default = Undefined
        return SingleParameterizedProperty._validate_type_param(type_param, help_allowed=help_allowed, default=default)

    def make_descriptor(self, name: str) -> DataSpecPropertyDescriptor:
        descriptor = self._dataspec.make_descriptor(name)
        descriptor.property = self
        descriptor.__doc__ = self.__doc__
        return descriptor

    @property
    def _units_enum(self) -> Any | None:
        return self._dataspec._units_enum

    @property
    def _units_alias(self) -> str:
        return self._dataspec._units_alias

    @property
    def value_type(self) -> Property[Any]:
        return self._dataspec.value_type

    def to_serializable(self, obj: HasProps, name: str, val: Any) -> Vectorized:
        return self._dataspec.to_serializable(obj, name, val)

    def prepare_value(self, owner: HasProps | type[HasProps], name: str, value: Any, *, hint: DocumentPatchedEvent | None = None) -> Any:
        self._dataspec.alternatives = self.alternatives
        self._dataspec.assertions = self.assertions
        return self._dataspec.prepare_value(owner, name, value, hint=hint)

    def transform(self, value: Any) -> T | None:
        return self._dataspec.transform(value)

    def wrap(self, value: Any) -> Any:
        return self._dataspec.wrap(value)

    def validate(self, value: Any, detail: bool = True) -> None:
        self._dataspec.validate(value, detail=detail)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

@register_type_link(Nullable)
@register_type_link(NullableProp)
@register_type_link(NullableSpec)
def _sphinx_type_link(obj: SingleParameterizedProperty[Any]) -> str:
    return f":class:`~bokeh.core.properties.Nullable`\\ ({type_link(obj.type_param)})"
