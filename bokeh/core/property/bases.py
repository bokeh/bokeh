#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
""" Provide base classes for the Bokeh property system.

.. note::
    These classes form part of the very low-level machinery that implements
    the Bokeh model and property system. It is unlikely that any of these
    classes or their methods will be applicable to any standard usage or to
    anyone who is not directly developing on Bokeh's own infrastructure.

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
import types
from copy import copy
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    ClassVar,
    Dict,
    List,
    Tuple,
    Type,
    TypeVar,
    Union,
)

# External imports
import numpy as np

# Bokeh imports
from ...util.dependencies import import_optional
from ...util.string import nice_join
from ..has_props import HasProps
from ._sphinx import property_link, register_type_link, type_link
from .descriptor_factory import PropertyDescriptorFactory
from .descriptors import PropertyDescriptor
from .singletons import (
    Intrinsic,
    IntrinsicType,
    Undefined,
    UndefinedType,
)

if TYPE_CHECKING:
    from ...document.events import DocumentPatchedEvent
    from ..types import ID

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

pd = import_optional('pandas')

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

__all__ = (
    'ContainerProperty',
    'DeserializationError',
    'PrimitiveProperty',
    'Property',
    'validation_on',
)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

T = TypeVar("T")

TypeOrInst = Union[Type[T], T]

Init = Union[T, UndefinedType, IntrinsicType]

class DeserializationError(Exception):
    pass

class Property(PropertyDescriptorFactory[T]):
    """ Base class for Bokeh property instances, which can be added to Bokeh
    Models.

    Args:
        default (obj, optional) :
            A default value for attributes created from this property to have.

        help (str or None, optional) :
            A documentation string for this property. It will be automatically
            used by the :ref:`bokeh.sphinxext.bokeh_prop` extension when
            generating Spinx documentation. (default: None)

        serialized (bool, optional) :
            Whether attributes created from this property should be included
            in serialization (default: True)

        readonly (bool, optional) :
            Whether attributes created from this property are read-only.
            (default: False)

    """

    # This class attribute is controlled by external helper API for validation
    _should_validate: ClassVar[bool] = True

    _readonly: bool

    alternatives: List[Tuple[Property[Any], Callable[[Property[Any]], T]]]
    assertions: List[Tuple[Callable[[HasProps, T], bool], str | Callable[[HasProps, str, T], None]]]

    def __init__(self, default: Init[T] = Intrinsic, help: str | None = None,
            serialized: bool | None = None, readonly: bool = False):
        default = default if default is not Intrinsic else Undefined

        if serialized is None:
            self._serialized = False if readonly and default is Undefined else True
        else:
            self._serialized = serialized

        self._readonly = readonly
        self._default = default
        self._help = help
        self.__doc__ = help

        self.alternatives = []
        self.assertions = []

    def __str__(self) -> str:
        return self.__class__.__name__

    def make_descriptors(self, name: str) -> List[PropertyDescriptor[T]]:
        """ Return a list of ``PropertyDescriptor`` instances to install
        on a class, in order to delegate attribute access to this property.

        Args:
            name (str) : the name of the property these descriptors are for

        Returns:
            list[PropertyDescriptor]

        The descriptors returned are collected by the ``MetaHasProps``
        metaclass and added to ``HasProps`` subclasses during class creation.
        """
        return [ PropertyDescriptor(name, self) ]

    def _may_have_unstable_default(self) -> bool:
        """ False if we have a default that is immutable, and will be the
        same every time (some defaults are generated on demand by a function
        to be called).

        """
        return isinstance(self._default, types.FunctionType)

    @classmethod
    def _copy_default(cls, default: Callable[[], T] | T) -> T:
        """ Return a copy of the default, or a new value if the default
        is specified by a function.

        """
        if not isinstance(default, types.FunctionType):
            return copy(default)
        else:
            return default()

    def _raw_default(self) -> T:
        """ Return the untransformed default value.

        The raw_default() needs to be validated and transformed by
        prepare_value() before use, and may also be replaced later by
        subclass overrides or by themes.

        """
        return self._copy_default(self._default)

    def themed_default(self, cls: Type[HasProps], name: str, theme_overrides: Dict[str, Any] | None) -> T:
        """ The default, transformed by prepare_value() and the theme overrides.

        """
        overrides = theme_overrides
        if overrides is None or name not in overrides:
            overrides = cls._overridden_defaults()

        if name in overrides:
            default = self._copy_default(overrides[name])
        else:
            default = self._raw_default()
        return self.prepare_value(cls, name, default)

    @property
    def serialized(self) -> bool:
        """ Whether the property should be serialized when serializing an object.

        This would be False for a "virtual" or "convenience" property that duplicates
        information already available in other properties, for example.
        """
        return self._serialized

    @property
    def readonly(self) -> bool:
        """ Whether this property is read-only.

        Read-only properties may only be modified by the client (i.e., by BokehJS
        in the browser).

        """
        return self._readonly

    def matches(self, new: T, old: T) -> bool:
        """ Whether two parameters match values.

        If either ``new`` or ``old`` is a NumPy array or Pandas Series or Index,
        then the result of ``np.array_equal`` will determine if the values match.

        Otherwise, the result of standard Python equality will be returned.

        Returns:
            True, if new and old match, False otherwise

        """
        if isinstance(new, np.ndarray) or isinstance(old, np.ndarray):
            return np.array_equal(new, old)

        if pd:
            if isinstance(new, pd.Series) or isinstance(old, pd.Series):
                return np.array_equal(new, old)

            if isinstance(new, pd.Index) or isinstance(old, pd.Index):
                return np.array_equal(new, old)

        try:

            # this handles the special but common case where there is a dict with array
            # or series as values (e.g. the .data property of a ColumnDataSource)
            if isinstance(new, dict) and isinstance(old, dict):
                if set(new.keys()) != set(old.keys()):
                    return False
                return all(self.matches(new[k], old[k]) for k in new)

            # FYI Numpy can erroneously raise a warning about elementwise
            # comparison here when a timedelta is compared to another scalar.
            # https://github.com/numpy/numpy/issues/10095
            return new == old

        # if the comparison fails for some reason, just punt and return no-match
        except ValueError:
            return False

    def from_json(self, json: Any, *, models: Dict[ID, HasProps] | None = None) -> T:
        """ Convert from JSON-compatible values into a value for this property.

        JSON-compatible values are: list, dict, number, string, bool, None

        """
        return json

    def serialize_value(self, value: T) -> Any:
        """ Change the value into a JSON serializable format.

        """
        return value

    def transform(self, value: Any) -> T:
        """ Change the value into the canonical format for this property.

        Args:
            value (obj) : the value to apply transformation to.

        Returns:
            obj: transformed value

        """
        return value

    def validate(self, value: Any, detail: bool = True) -> None:
        """ Determine whether we can set this property from this value.

        Validation happens before transform()

        Args:
            value (obj) : the value to validate against this property type
            detail (bool, options) : whether to construct detailed exceptions

                Generating detailed type validation error messages can be
                expensive. When doing type checks internally that will not
                escape exceptions to users, these messages can be skipped
                by setting this value to False (default: True)

        Returns:
            None

        Raises:
            ValueError if the value is not valid for this property type

        """
        pass

    def is_valid(self, value: Any) -> bool:
        """ Whether the value passes validation

        Args:
            value (obj) : the value to validate against this property type

        Returns:
            True if valid, False otherwise

        """
        try:
            if validation_on():
                self.validate(value, False)
        except ValueError:
            return False
        else:
            return True

    def wrap(self, value: T) -> T:
        """ Some property types need to wrap their values in special containers, etc.

        """
        return value

    def _hinted_value(self, value: Any, hint: DocumentPatchedEvent | None) -> Any:
        return value

    def prepare_value(self, owner: HasProps | Type[HasProps], name: str, value: Any, *, hint: DocumentPatchedEvent | None = None) -> T:
        if value is Intrinsic:
            value = self._raw_default()
        if value is Undefined:
            return value


        error = None
        try:
            if validation_on():
                hinted_value = self._hinted_value(value, hint)
                self.validate(hinted_value)
        except ValueError as e:
            for tp, converter in self.alternatives:
                if tp.is_valid(value):
                    value = converter(value)
                    break
            else:
                error = e

        if error is None:
            value = self.transform(value)
        else:
            obj_repr = owner if isinstance(owner, HasProps) else owner.__name__
            raise ValueError(f"failed to validate {obj_repr}.{name}: {error}")

        if isinstance(owner, HasProps):
            obj = owner

            for fn, msg_or_fn in self.assertions:
                if isinstance(fn, bool):
                    result = fn
                else:
                    result = fn(obj, value)

                assert isinstance(result, bool)

                if not result:
                    if isinstance(msg_or_fn, str):
                        raise ValueError(msg_or_fn)
                    else:
                        msg_or_fn(obj, name, value)

        return self.wrap(value)

    @property
    def has_ref(self) -> bool:
        return False

    def accepts(self, tp: TypeOrInst[Property[Any]], converter: Callable[[Property[Any]], T]) -> Property[T]:
        """ Declare that other types may be converted to this property type.

        Args:
            tp (Property) :
                A type that may be converted automatically to this property
                type.

            converter (callable) :
                A function accepting ``value`` to perform conversion of the
                value to this property type.

        Returns:
            self

        """

        tp = ParameterizedProperty._validate_type_param(tp)
        self.alternatives.append((tp, converter))
        return self

    def asserts(self, fn: Callable[[HasProps, T], bool], msg_or_fn: str | Callable[[HasProps, str, T], None]) -> Property[T]:
        """ Assert that prepared values satisfy given conditions.

        Assertions are intended in enforce conditions beyond simple value
        type validation. For instance, this method can be use to assert that
        the columns of a ``ColumnDataSource`` all collectively have the same
        length at all times.

        Args:
            fn (callable) :
                A function accepting ``(obj, value)`` that returns True if the value
                passes the assertion, or False otherwise.

            msg_or_fn (str or callable) :
                A message to print in case the assertion fails, or a function
                accepting ``(obj, name, value)`` to call in in case the assertion
                fails.

        Returns:
            self

        """
        self.assertions.append((fn, msg_or_fn))
        return self

TItem = TypeVar("TItem", bound=Property[Any])

class ParameterizedProperty(Property[TItem]):
    """ A base class for Properties that have type parameters, e.g. ``List(String)``.

    """

    @staticmethod
    def _validate_type_param(type_param: TypeOrInst[Property[Any]], *, help_allowed: bool = False) -> Property[Any]:
        if isinstance(type_param, type):
            if issubclass(type_param, Property):
                return type_param()
            else:
                type_param = type_param.__name__
        elif isinstance(type_param, Property):
            if type_param._help is not None and not help_allowed:
                raise ValueError("setting 'help' on type parameters doesn't make sense")

            return type_param

        raise ValueError(f"expected a Property as type parameter, got {type_param}")

    @property
    def type_params(self) -> List[Property[Any]]:
        raise NotImplementedError("abstract method")

    @property
    def has_ref(self) -> bool:
        return any(type_param.has_ref for type_param in self.type_params)

class SingleParameterizedProperty(ParameterizedProperty[T]):
    """ A parameterized property with a single type parameter. """

    def __init__(self, type_param: TypeOrInst[Property[Any]], *, default: Init[T] = Intrinsic,
            help: str | None = None, serialized: bool | None = None, readonly: bool = False):
        self.type_param = self._validate_type_param(type_param)
        default = default if default is not Intrinsic else self.type_param._raw_default()
        super().__init__(default=default, help=help, serialized=serialized, readonly=readonly)

    @property
    def type_params(self) -> List[Property[Any]]:
        return [self.type_param]

    def __str__(self) -> str:
        return f"{self.__class__.__name__}({self.type_param})"

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail=detail)
        self.type_param.validate(value, detail=detail)

    def from_json(self, json: Any, *, models: Dict[str, HasProps] | None = None) -> T:
        return self.type_param.from_json(json, models=models)

    def transform(self, value: T) -> T:
        return self.type_param.transform(value)

    def wrap(self, value: T) -> T:
        return self.type_param.wrap(value)

    def _may_have_unstable_default(self) -> bool:
        return self.type_param._may_have_unstable_default()

class PrimitiveProperty(Property[T]):
    """ A base class for simple property types.

    Subclasses should define a class attribute ``_underlying_type`` that is
    a tuple of acceptable type values for the property.

    Example:

        A trivial version of a ``Float`` property might look like:

        .. code-block:: python

            class Float(PrimitiveProperty):
                _underlying_type = (numbers.Real,)

    """

    _underlying_type: ClassVar[Tuple[Type[T]]]

    def validate(self, value: Any, detail: bool = True) -> None:
        super().validate(value, detail)

        if isinstance(value, self._underlying_type):
            return

        if not detail:
            raise ValueError("")

        expected_type = nice_join([ cls.__name__ for cls in self._underlying_type ])
        msg = f"expected a value of type {expected_type}, got {value} of type {type(value).__name__}"
        raise ValueError(msg)

    def from_json(self, json: Any, *, models: Dict[str, HasProps] | None = None) -> T:
        if isinstance(json, self._underlying_type):
            return json
        expected_type = nice_join([ cls.__name__ for cls in self._underlying_type ])
        msg = f"{self} expected {expected_type}, got {json} of type {type(json).__name__}"
        raise DeserializationError(msg)

class ContainerProperty(ParameterizedProperty[T]):
    """ A base class for Container-like type properties.

    """

    def _may_have_unstable_default(self) -> bool:
        # all containers are mutable, so the default can be modified
        return True

def validation_on() -> bool:
    """ Check if property validation is currently active

    Returns:
        bool

    """
    return Property._should_validate

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

@register_type_link(SingleParameterizedProperty)
def _sphinx_type(obj):
    return f"{property_link(obj)}({type_link(obj.type_param)})"
