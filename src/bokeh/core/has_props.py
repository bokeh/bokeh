#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Provide a base class for objects that can have declarative, typed,
serializable properties.

.. note::
    These classes form part of the very low-level machinery that implements
    the Bokeh model and property system. It is unlikely that any of these
    classes or their methods will be applicable to any standard usage or to
    anyone who is not directly developing on Bokeh's own infrastructure.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

# pyright: reportArgumentType=false, reportAssignmentType=false, reportAttributeAccessIssue=false

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import difflib
from collections.abc import Mapping, Sequence
from types import MappingProxyType
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    ClassVar,
    Iterable,
    Literal,
    NoReturn,
    NotRequired,
    Self,
    TypedDict,
    cast,
    overload,
)
from weakref import WeakSet

# Bokeh imports
from ..settings import settings
from ..util.strings import append_docstring
from .property.descriptors import (
    AliasPropertyDescriptor,
    PropertyDescriptor,
    UnsetValueError,
)
from .property.enum import Enum
from .property.serialized import NotSerialized
from .property.singletons import Undefined
from .serialization import (
    ObjectRep,
    Ref,
    Serializable,
    Serializer,
)

if TYPE_CHECKING:
    from ..client.session import ClientSession
    from ..server.session import ServerSession
    from ..util.compiler import Implementation
    from .property.bases import Property
    from .property.dataspec import DataSpec

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'abstract',
    'HasProps',
    'NonQualified',
    'Qualified',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

if TYPE_CHECKING:
    type Setter = ClientSession | ServerSession

_abstract_classes: WeakSet[type[HasProps]] = WeakSet()

def abstract[C: type[HasProps]](cls: C) -> C:
    ''' A decorator to mark abstract base classes derived from |HasProps|.

    '''
    if not issubclass(cls, HasProps):
        raise TypeError(f"{cls.__name__} is not a subclass of HasProps")
    _abstract_classes.add(cls)
    cls.__doc__ = append_docstring(cls.__doc__, _ABSTRACT_ADMONITION)
    return cls

def is_abstract(cls: type[HasProps]) -> bool:
    return cls in _abstract_classes

def is_DataModel(cls: type[HasProps]) -> bool:
    from ..model import DataModel
    return issubclass(cls, HasProps) and getattr(cls, "__data_model__", False) and cls != DataModel

class _PropertyInfo:
    """Property metadata compiled once for each ``HasProps`` subclass."""

    own_properties: Mapping[str, Property[Any]]
    own_overridden_defaults: Mapping[str, Any]

    _properties: Mapping[str, Property[Any]]
    _descriptors: tuple[PropertyDescriptor[Any] | AliasPropertyDescriptor[Any], ...]
    _properties_with_refs: Mapping[str, Property[Any]]
    _dataspecs: Mapping[str, DataSpec]
    _overridden_defaults: Mapping[str, Any]

    def __init__(self, own_properties: Mapping[str, Property[Any]], own_overridden_defaults: Mapping[str, Any]) -> None:
        self.own_properties = own_properties
        self.own_overridden_defaults = own_overridden_defaults

    def _initialize(self, cls: type[HasProps]) -> None:
        if hasattr(self, "_properties"):
            return

        properties: dict[str, Property[Any]] = {}
        overridden_defaults: dict[str, Any] = {}

        for base in reversed(cls.__mro__[1:]):
            property_info = base.__dict__.get("__property_info__")
            if not isinstance(property_info, _PropertyInfo):
                continue

            properties.update(property_info.own_properties)
            overridden_defaults.update(property_info.own_overridden_defaults)

        properties.update(self.own_properties)
        overridden_defaults.update(self.own_overridden_defaults)

        descriptors: list[PropertyDescriptor[Any] | AliasPropertyDescriptor[Any]] = []
        for name in properties:
            descriptor = getattr(cls, name)
            if not isinstance(descriptor, (AliasPropertyDescriptor, PropertyDescriptor)):
                raise TypeError(
                    f"{cls.__name__}.{name} shadows a Bokeh property with "
                    f"{type(descriptor).__name__}",
                )
            descriptors.append(descriptor)

        self._properties = MappingProxyType(properties)
        self._descriptors = tuple(descriptors)
        self._properties_with_refs = MappingProxyType({name: prop for name, prop in properties.items() if prop.has_ref})
        self._overridden_defaults = MappingProxyType(overridden_defaults)

    def properties(self, cls: type[HasProps]) -> Mapping[str, Property[Any]]:
        self._initialize(cls)
        return self._properties

    def descriptors(self, cls: type[HasProps]) -> tuple[PropertyDescriptor[Any] | AliasPropertyDescriptor[Any], ...]:
        self._initialize(cls)
        return self._descriptors

    def properties_with_refs(self, cls: type[HasProps]) -> Mapping[str, Property[Any]]:
        self._initialize(cls)
        return self._properties_with_refs

    def dataspecs(self, cls: type[HasProps]) -> Mapping[str, DataSpec]:
        self._initialize(cls)
        if not hasattr(self, "_dataspecs"):
            from .property.dataspec import DataSpec  # avoid circular import

            self._dataspecs = MappingProxyType({name: prop for name, prop in self._properties.items() if isinstance(prop, DataSpec)})
        return self._dataspecs

    def overridden_defaults(self, cls: type[HasProps]) -> Mapping[str, Any]:
        self._initialize(cls)
        return self._overridden_defaults


class _ModelResolver:
    """ A class responsible for tracking of models and how to resolve them. """

    _known_models: dict[str, type[HasProps]]

    def __init__(self) -> None:
        self._known_models = {}

    def add(self, cls: type[HasProps]) -> None:
        if not (issubclass(cls, Local) or cls.__name__.startswith("_")):
            # update the mapping of view model names to classes, checking for any duplicates
            previous = self._known_models.get(cls.__qualified_model__, None)
            if previous is not None and not hasattr(cls, "__implementation__"):
                from ..util.warnings import BokehUserWarning, warn

                warn(f"Duplicate qualified model definition of '{cls.__qualified_model__}'. " \
                     f"Previous definition was {previous} (@{hex(id(previous))}), the new is {cls} (@{hex(id(cls))}).", BokehUserWarning)
            self._known_models[cls.__qualified_model__] = cls

    def remove(self, cls: type[HasProps]) -> None:
        del self._known_models[cls.__qualified_model__]

    @property
    def known_models(self) -> dict[str, type[HasProps]]:
        return dict(self._known_models)

    def clear_extensions(self) -> None:
        def is_extension(obj: type[HasProps]) -> bool:
            return getattr(obj, "__implementation__", None) is not None or \
                   getattr(obj, "__javascript__", None) is not None or \
                   getattr(obj, "__css__", None) is not None

        self._known_models = {key: val for key, val in self._known_models.items() if not is_extension(val)}

_default_resolver = _ModelResolver()

class _ModelClassReverseMap:
    def __get__(self, _obj: Any, _owner: type[HasProps]) -> dict[str, type[HasProps]]:
        return _default_resolver.known_models

class Local:
    """Don't register this class in model registry. """

class Qualified:
    """Resolve this class by a fully qualified name. """

class NonQualified:
    """Resolve this class by a non-qualified name. """

def _check_units_props(
    cls: type[HasProps],
    own_properties: Mapping[str, Property[Any]],
    properties: Mapping[str, Property[Any]],
    property_bases: list[type[HasProps]],
) -> None:
    if len(property_bases) > 1:
        units_specs = {
            name: prop for name, prop in properties.items()
            if getattr(prop, "_units_enum", None) is not None
        }
    else:
        units_specs = {
            name: prop for name, prop in own_properties.items()
            if getattr(prop, "_units_enum", None) is not None
        }
        for units_name in own_properties:
            if units_name.endswith("_units"):
                name = units_name.removesuffix("_units")
                prop = properties.get(name)
                if prop is not None and getattr(prop, "_units_enum", None) is not None:
                    units_specs[name] = prop

    for name, prop in units_specs.items():
        units_enum = getattr(prop, "_units_enum", None)

        units_name = f"{name}_units"
        units_descriptor = cls.lookup(units_name, raises=False)
        units_prop = units_descriptor.property if isinstance(units_descriptor, PropertyDescriptor) else None

        valid_units_prop = isinstance(units_prop, NotSerialized) and \
            isinstance(units_prop.type_param, Enum) and \
            tuple(units_prop.type_param.allowed_values) == tuple(units_enum)
        if not valid_units_prop:
            units_alias = getattr(prop, "_units_alias")
            raise TypeError(
                f"{cls.__name__}.{name} uses {type(prop).__name__} and requires a matching "
                f"{cls.__name__}.{units_name} property; add `{units_name} = {units_alias}`",
            )

def _warn_redeclared_props(
    cls: type[HasProps],
    own_properties: Mapping[str, Property[Any]],
    property_bases: list[type[HasProps]],
) -> None:
    base_properties: dict[str, Any] = {}
    for base in property_bases:
        base_properties.update(base.properties())

    redeclared = own_properties.keys() & base_properties.keys()
    if redeclared:
        from ..util.warnings import warn

        warn(f"Properties {redeclared!r} in class {cls.__name__} were previously declared on a parent "
             "class. It never makes sense to do this. Redundant properties should be deleted here, or on "
             "the parent class. Override() can be used to change a default value of a base class property.",
             RuntimeWarning)

def _warn_unused_overrides(
    cls: type[HasProps],
    own_overridden_defaults: Mapping[str, Any],
    properties: Mapping[str, Property[Any]],
) -> None:
    unused_overrides = own_overridden_defaults.keys() - properties.keys()
    if unused_overrides:
        from ..util.warnings import warn

        warn(f"Overrides of {sorted(unused_overrides)} in class {cls.__name__} do not override anything.", RuntimeWarning)

def _init_model_name(cls: type[HasProps]) -> None:
    cls.__view_model__ = cls.__dict__.get(
        "__view_model__",
        cls.__qualname__.replace("<locals>.", ""),
    )
    cls.__view_module__ = cls.__dict__.get("__view_module__", cls.__module__)

    if "__qualified_model__" in cls.__dict__:
        return

    module = cls.__view_module__
    model = cls.__view_model__

    if issubclass(cls, NonQualified):
        cls.__qualified_model__ = model
    elif issubclass(cls, Qualified):
        cls.__qualified_model__ = f"{module}.{model}"
    elif module.split(".")[0] in ("bokeh", "__main__") or "__implementation__" in cls.__dict__:
        cls.__qualified_model__ = model
    else:
        cls.__qualified_model__ = f"{module}.{model}"

class HasProps(Serializable):
    ''' Base class for all class types that have Bokeh properties.

    '''
    _initialized: bool = False

    _property_values: dict[str, Any]
    _materialized_defaults: dict[str, Any]
    _materialized_themed_defaults: dict[str, Any]

    __properties__: Mapping[str, Property[Any]] = MappingProxyType({})
    __overridden_defaults__: Mapping[str, Any] = MappingProxyType({})
    __property_info__ = _PropertyInfo(__properties__, __overridden_defaults__)

    model_class_reverse_map = _ModelClassReverseMap()

    __view_model__: ClassVar[str]
    __view_module__: ClassVar[str]
    __qualified_model__: ClassVar[str]
    __implementation__: ClassVar[str | Implementation]
    __data_model__: ClassVar[bool]

    @classmethod
    def __init_subclass__(cls, **kwargs: Any) -> None:
        own_properties = MappingProxyType(dict(cls.__dict__.get("__properties__", {})))
        own_overridden_defaults = MappingProxyType(dict(cls.__dict__.get("__overridden_defaults__", {})))
        cls.__properties__ = own_properties
        cls.__overridden_defaults__ = own_overridden_defaults
        cls.__property_info__ = property_info = _PropertyInfo(own_properties, own_overridden_defaults)

        super().__init_subclass__(**kwargs)

        properties = property_info.properties(cls)

        property_bases = [base for base in cls.__bases__ if issubclass(base, HasProps)]
        _check_units_props(cls, own_properties, properties, property_bases)
        _warn_redeclared_props(cls, own_properties, property_bases)
        _warn_unused_overrides(cls, own_overridden_defaults, properties)

        _init_model_name(cls)
        _default_resolver.add(cls)

    def __init__(self, **properties: Any) -> None:
        '''

        '''
        super().__init__()
        self._property_values = {}
        self._materialized_defaults = {}
        self._materialized_themed_defaults = {}

        for name, value in properties.items():
            setattr(self, name, value)

        self._initialized = True

    def __setattr__(self, name: str, value: Any) -> None:
        ''' Intercept attribute setting on HasProps in order to special case
        a few situations:

        * short circuit all property machinery for ``_private`` attributes
        * suggest similar attribute names on attribute errors

        Args:
            name (str) : the name of the attribute to set on this object
            value (obj) : the value to set

        Returns:
            None

        '''
        if name.startswith("_"):
            return super().__setattr__(name, value)

        properties = self.properties()
        if name in properties:
            return super().__setattr__(name, value)

        descriptor = getattr(self.__class__, name, None)
        if isinstance(descriptor, property): # Python property
            return super().__setattr__(name, value)

        self._raise_attribute_error_with_matches(name, properties)

    def __getattr__(self, name: str) -> Any:
        ''' Intercept attribute setting on HasProps in order to special case
        a few situations:

        * short circuit all property machinery for ``_private`` attributes
        * suggest similar attribute names on attribute errors

        Args:
            name (str) : the name of the attribute to set on this object

        Returns:
            Any

        '''
        if name.startswith("_"):
            return super().__getattribute__(name)

        properties = self.properties()
        if name in properties:
            return super().__getattribute__(name)

        descriptor = getattr(self.__class__, name, None)
        if isinstance(descriptor, property): # Python property
            return super().__getattribute__(name)

        self._raise_attribute_error_with_matches(name, properties)

    def _raise_attribute_error_with_matches(self, name: str, properties: Iterable[str]) -> NoReturn:
        if not settings.perform_error_diagnostics():
            raise AttributeError(f"unexpected attribute {name!r} to {self.__class__.__name__}")

        matches, text = difflib.get_close_matches(name.lower(), properties), "similar"

        if not matches:
            matches, text = sorted(properties), "possible"

        from ..util.strings import nice_join

        raise AttributeError(f"unexpected attribute {name!r} to {self.__class__.__name__}, {text} attributes are {nice_join(matches)}")

    def __str__(self) -> str:
        name = self.__class__.__name__
        return f"{name}(...)"

    __repr__ = __str__

    # Unfortunately we cannot implement __eq__. We rely on the default __hash__
    # based on object identity, in order to put HasProps instances in sets.
    # Implementing __eq__ as structural equality would necessitate a __hash__
    # that returns the same value different HasProps instances that compare
    # equal [1], and this would break many things.
    #
    # [1] https://docs.python.org/3/reference/datamodel.html#object.__hash__
    #
    def equals(self, other: HasProps) -> bool:
        ''' Structural equality of models.

        Args:
            other (HasProps) : the other instance to compare to

        Returns:
            True, if properties are structurally equal, otherwise False

        '''
        if not isinstance(other, self.__class__):
            return False
        else:
            return self.properties_with_values() == other.properties_with_values()

    def to_serializable(self, serializer: Serializer) -> ObjectRep:
        rep = ObjectRep(
            type="object",
            name=self.__qualified_model__,
        )

        properties = self.properties_with_values(include_defaults=settings.serialize_include_defaults())
        attributes = {key: serializer.encode(val) for key, val in properties.items()}

        if attributes:
            rep["attributes"] = attributes

        return rep

    # FQ type name required to suppress Sphinx error "more than one target found for cross-reference 'JSON'"
    def set_from_json(self, name: str, value: Any, *, setter: Setter | None = None) -> None:
        ''' Set a property value on this object from JSON.

        Args:
            name (str) : name of the attribute to set

            value (JSON-value) : value to set to the attribute to

            setter(ClientSession or ServerSession or None, optional) :
                This is used to prevent "boomerang" updates to Bokeh apps.

                In the context of a Bokeh server application, incoming updates
                to properties will be annotated with the session that is
                doing the updating. This value is propagated through any
                subsequent change notifications that the update triggers.
                The session can compare the event setter to itself, and
                suppress any updates that originate from itself.

        Returns:
            None

        '''
        if name in self.properties():
            log.trace(f"Patching attribute {name!r} of {self!r} with {value!r}") # type: ignore[attr-defined]
            descriptor = self.lookup(name)
            descriptor.set_from_json(self, value, setter=setter)
        else:
            log.warning("JSON had attr %r on obj %r, which is a client-only or invalid attribute that shouldn't have been sent", name, self)

    def update(self, **kwargs: Any) -> None:
        ''' Updates the object's properties from the given keyword arguments.

        Returns:
            None

        Examples:

            The following are equivalent:

            .. code-block:: python

                from bokeh.models import Range1d

                r = Range1d

                # set properties individually:
                r.start = 10
                r.end = 20

                # update properties together:
                r.update(start=10, end=20)

        '''
        for k, v in kwargs.items():
            setattr(self, k, v)

    @overload
    @classmethod
    def lookup(cls, name: str, *, raises: Literal[True] = True) -> PropertyDescriptor[Any]: ...

    @overload
    @classmethod
    def lookup(cls, name: str, *, raises: Literal[False] = False) -> PropertyDescriptor[Any] | None: ...

    @classmethod
    def lookup(cls, name: str, *, raises: bool = True) -> PropertyDescriptor[Any] | None:
        ''' Find the ``PropertyDescriptor`` for a Bokeh property on a class,
        given the property name.

        Args:
            name (str) : name of the property to search for
            raises (bool) : whether to raise or return None if missing

        Returns:
            PropertyDescriptor : descriptor for property named ``name``

        '''
        attr = getattr(cls, name, None)
        if attr is not None or (attr is None and not raises):
            return attr
        raise AttributeError(f"{cls.__name__}.{name} property descriptor does not exist")

    @classmethod
    def properties(cls) -> Mapping[str, Property[Any]]:
        ''' Collect the properties on this class.

        Returns:
            a mapping of property names to property objects

        '''
        return cls.__property_info__.properties(cls)

    @classmethod
    def descriptors(cls) -> Sequence[PropertyDescriptor[Any] | AliasPropertyDescriptor[Any]]:
        """ List of property descriptors in the order of definition. """
        return cls.__property_info__.descriptors(cls)

    @classmethod
    def properties_with_refs(cls) -> Mapping[str, Property[Any]]:
        ''' Collect the names of all properties on this class that also have
        references.

        This method *always* traverses the class hierarchy and includes
        properties defined on any parent classes.

        Returns:
            a mapping of property names to properties that have references

        '''
        return cls.__property_info__.properties_with_refs(cls)

    @classmethod
    def dataspecs(cls) -> Mapping[str, DataSpec]:
        ''' Collect the names of all ``DataSpec`` properties on this class.

        This method *always* traverses the class hierarchy and includes
        properties defined on any parent classes.

        Returns:
            a mapping of property names to ``DataSpec`` properties

        '''
        return cls.__property_info__.dataspecs(cls)

    def properties_with_values(self, *, include_defaults: bool = True, include_undefined: bool = False) -> dict[str, Any]:
        ''' Collect a dict mapping property names to their values.

        This method *always* traverses the class hierarchy and includes
        properties defined on any parent classes.

        Non-serializable properties are skipped and property values are in
        "serialized" format which may be slightly different from the values
        you would normally read from the properties; the intent of this method
        is to return the information needed to losslessly reconstitute the
        object instance.

        Args:
            include_defaults (bool, optional) :
                Whether to include properties that haven't been explicitly set
                since the object was created. (default: True)

        Returns:
           dict : mapping from property names to their values

        '''
        return self.query_properties_with_values(lambda prop: prop.serialized,
            include_defaults=include_defaults, include_undefined=include_undefined)

    @classmethod
    def _overridden_defaults(cls) -> Mapping[str, Any]:
        ''' Returns a dictionary of defaults that have been overridden.

        .. note::
            This is an implementation detail of ``Property``.

        '''
        return cls.__property_info__.overridden_defaults(cls)

    def query_properties_with_values(self, query: Callable[[PropertyDescriptor[Any]], bool], *,
            include_defaults: bool = True, include_undefined: bool = False) -> dict[str, Any]:
        ''' Query the properties values of |HasProps| instances with a
        predicate.

        Args:
            query (callable) :
                A callable that accepts property descriptors and returns True
                or False

            include_defaults (bool, optional) :
                Whether to include properties that have not been explicitly
                set by a user (default: True)

        Returns:
            dict : mapping of property names and values for matching properties

        '''
        result: dict[str, Any] = {}

        keys = self.properties()

        for key in keys:
            descriptor = self.lookup(key)
            if not query(descriptor):
                continue

            if descriptor.value_is_unset(self):
                if include_undefined:
                    value = Undefined
                else:
                    raise UnsetValueError(f"{self}.{key} doesn't have a value set")
            elif not include_defaults and not descriptor.value_must_be_serialized(self):
                continue
            else:
                value = descriptor.get_value(self)

            result[key] = value

        return result

    def themed_values(self) -> dict[str, Any] | None:
        ''' Get any theme-provided overrides.

        Results are returned as a dict from property name to value, or
        ``None`` if no theme overrides any values for this instance.

        Returns:
            dict or None

        '''
        return getattr(self, '__themed_values__', None)

    def apply_theme(self, property_values: dict[str, Any]) -> None:
        ''' Apply a set of theme values which will be used rather than
        defaults, but will not override application-set values.

        The passed-in dictionary may be kept around as-is and shared with
        other instances to save memory (so neither the caller nor the
        |HasProps| instance should modify it).

        Args:
            property_values (dict) : theme values to use in place of defaults

        Returns:
            None

        '''
        old_dict = self.themed_values()

        # if the same theme is set again, it should reuse the same dict
        if old_dict is property_values:
            return

        removed: set[str] = set()
        # we're doing a little song-and-dance to avoid storing __themed_values__ or
        # an empty dict, if there's no theme that applies to this HasProps instance.
        if old_dict is not None:
            removed.update(set(old_dict.keys()))
        added = set(property_values.keys())
        old_values: dict[str, Any] = {}
        for k in added.union(removed):
            descriptor = self.lookup(k)
            if not isinstance(descriptor, PropertyDescriptor):
                continue
            if k not in self._property_values and descriptor.default_is_unset(self, property_values):
                raise UnsetValueError(f"applying this theme would unset {self}.{k}")
            old_values[k] = descriptor._get(self)

        if len(property_values) > 0:
            setattr(self, '__themed_values__', property_values)
        elif hasattr(self, '__themed_values__'):
            delattr(self, '__themed_values__')

        # Property container values might be cached even if unmodified. Invalidate
        # any cached values that are not modified at this point.
        for k, v in old_values.items():
            if k in self._materialized_themed_defaults:
                del self._materialized_themed_defaults[k]

        # Emit any change notifications that result
        for k, v in old_values.items():
            descriptor = self.lookup(k)
            if isinstance(descriptor, PropertyDescriptor):
                descriptor.trigger_if_changed(self, v)

    def unapply_theme(self) -> None:
        ''' Remove any themed values and restore defaults.

        Returns:
            None

        '''
        self.apply_theme(property_values={})

    def clone(self, **overrides: Any) -> Self:
        ''' Duplicate a ``HasProps`` object.

        This creates a shallow clone of the original model, i.e. any mutable
        containers or child models will not be duplicated. Allows to override
        particular properties while cloning.

        '''
        attrs = self.properties_with_values(include_defaults=False, include_undefined=True)
        existing = {key: val for key, val in attrs.items() if val is not Undefined}
        properties = {**existing, **overrides}
        return self.__class__(**properties)

type PrimitiveKindRef = Literal["Any", "Unknown", "Bool", "Float", "Int", "Bytes", "Str", "Null"]
type KindRef = (
    PrimitiveKindRef
    | tuple[Literal["Regex"], str]
    | tuple[Literal["Nullable"], KindRef]
    | tuple[Literal["Or"], KindRef, *tuple[KindRef, ...]]
    | tuple[Literal["Tuple"], KindRef, *tuple[KindRef, ...]]
    | tuple[Literal["List"], KindRef]
    | tuple[Literal["Struct"], *tuple[tuple[str, KindRef], ...]]
    | tuple[Literal["Dict"], KindRef]
    | tuple[Literal["Mapping"], KindRef, KindRef]
    | tuple[Literal["Enum"], *tuple[str, ...]]
    | tuple[Literal["Ref"], Ref]
    | tuple[Literal["AnyRef"]]
)

class PropertyDef(TypedDict):
    name: str
    kind: KindRef
    default: NotRequired[Any]

class OverrideDef(TypedDict):
    name: str
    default: Any

class ModelDef(TypedDict):
    type: Literal["model"]
    name: str
    extends: NotRequired[Ref | None]
    properties: NotRequired[list[PropertyDef]]
    overrides: NotRequired[list[OverrideDef]]

def _data_model_bases(cls: type[HasProps]) -> list[type[HasProps]]:
    from ..model import DataModel, Model

    return cast(list[type[HasProps]], [base for base in cls.__bases__ if issubclass(base, Model) and base is not DataModel])

def _property_kind(prop: Property[Any], serializer: Serializer) -> KindRef:
    from ..model import Model
    from .property.any import Any as AnyProperty, AnyRef
    from .property.bases import SingleParameterizedProperty
    from .property.container import Dict, List, Tuple
    from .property.either import Either
    from .property.enum import Enum
    from .property.instance import Instance
    from .property.nullable import Nullable
    from .property.primitive import (
        Bool,
        Bytes,
        Float,
        Int,
        Null,
        String,
    )
    from .property.string import Regex
    from .property.struct import Struct

    if isinstance(prop, AnyRef):
        return ("AnyRef",)
    if isinstance(prop, AnyProperty):
        return "Any"
    if isinstance(prop, Regex):
        return ("Regex", prop.regex.pattern)
    if isinstance(prop, Bool):
        return "Bool"
    if isinstance(prop, Int):
        return "Int"
    if isinstance(prop, Float):
        return "Float"
    if isinstance(prop, Bytes):
        return "Bytes"
    if isinstance(prop, String):
        return "Str"
    if isinstance(prop, Null):
        return "Null"
    if isinstance(prop, Nullable):
        return ("Nullable", _property_kind(prop.type_param, serializer))
    if isinstance(prop, Enum):
        values = prop.allowed_values
        return cast(KindRef, ("Enum", *values)) if all(isinstance(value, str) for value in values) else "Any"
    if isinstance(prop, Either):
        kinds = tuple(_property_kind(type_param, serializer) for type_param in prop.type_params)
        if not kinds or "Any" in kinds:
            return "Any"
        return cast(KindRef, ("Or", kinds[0], *kinds[1:]))
    if isinstance(prop, Tuple):
        kinds = tuple(_property_kind(type_param, serializer) for type_param in prop.type_params)
        if not kinds:
            return "Any"
        return cast(KindRef, ("Tuple", kinds[0], *kinds[1:]))
    if isinstance(prop, List):
        return ("List", _property_kind(prop.item_type, serializer))
    if isinstance(prop, Struct):
        if prop._optional:
            return "Any"
        return ("Struct", *((name, _property_kind(type_param, serializer)) for name, type_param in prop._fields.items()))
    if isinstance(prop, Dict):
        key_kind = _property_kind(prop.keys_type, serializer)
        value_kind = _property_kind(prop.values_type, serializer)
        if isinstance(prop.keys_type, (String, Regex)) or (
            isinstance(prop.keys_type, Enum) and all(isinstance(value, str) for value in prop.keys_type.allowed_values)
        ):
            return ("Dict", value_kind)
        return ("Mapping", key_kind, value_kind)
    if isinstance(prop, Instance):
        instance_type = prop.instance_type
        if isinstance(instance_type, type) and issubclass(instance_type, HasProps):
            if is_DataModel(instance_type):
                if serializer.has_ref(instance_type):
                    return ("Ref", Ref(id=instance_type.__qualified_model__))
                return ("AnyRef",)
            if issubclass(instance_type, Model):
                return ("Ref", Ref(id=instance_type.__qualified_model__))
            return ("AnyRef",)
        return "Any"
    if isinstance(prop, SingleParameterizedProperty):
        return _property_kind(prop.type_param, serializer)
    return "Any"

def _property_data_models(prop: Property[Any]) -> set[type[HasProps]]:
    from .property.instance import Instance

    dependencies: set[type[HasProps]] = set()
    if isinstance(prop, Instance):
        instance_type = prop.instance_type
        if isinstance(instance_type, type) and is_DataModel(instance_type):
            dependencies.add(instance_type)
    for type_param in getattr(prop, "type_params", ()):
        dependencies.update(_property_data_models(type_param))
    return dependencies

def _data_models_in_dependency_order(data_models: Iterable[type[HasProps]]) -> list[type[HasProps]]:
    remaining = list(dict.fromkeys(data_models))
    included = set(remaining)
    ordered: list[type[HasProps]] = []
    resolved: set[type[HasProps]] = set()

    while remaining:
        for cls in remaining:
            dependencies = set(_data_model_bases(cls))
            for prop in cls.properties().values():
                dependencies.update(_property_data_models(prop))
            dependencies.intersection_update(included)
            dependencies.discard(cls)
            if dependencies <= resolved:
                break
        else:
            # Cyclic Instance properties don't constrain definition order. The
            # first forward edge will use AnyRef and subsequent edges use Ref.
            cls = remaining[0]

        remaining.remove(cls)
        ordered.append(cls)
        resolved.add(cls)

    return ordered

def _same_default(prop: Property[Any], left: Any, right: Any) -> bool:
    return left is right or prop.matches(left, right)

def _encode_default(descriptor: PropertyDescriptor[Any], default: Any, serializer: Serializer) -> Any:
    if descriptor.is_default_factory(default):
        default = default()
    return serializer.encode(default)

def _HasProps_to_serializable(cls: type[HasProps], serializer: Serializer) -> Ref | ModelDef:
    from ..model import Model
    from .types import ID

    ref = Ref(id=ID(cls.__qualified_model__))
    serializer.add_ref(cls, ref)

    if not is_DataModel(cls):
        return ref

    bases = _data_model_bases(cls)
    if len(bases) == 0:
        extends = None
        base = Model
    elif len(bases) == 1:
        [base] = bases
        encoded_base = serializer.encode(base)
        if not (isinstance(encoded_base, dict) and set(encoded_base) == {"id"}):
            serializer.error(f"base model {base.__qualified_model__} must be defined before {cls.__qualified_model__}")
        extends = cast(Ref, encoded_base)
    else:
        serializer.error("multiple bases are not supported")

    properties: list[PropertyDef] = []
    overrides: list[OverrideDef] = []

    base_properties = base.properties()
    cls_properties = cls.properties()
    for prop_name, prop in cls_properties.items():
        if not prop.serialized or base_properties.get(prop_name) is prop:
            continue

        descriptor = cls.lookup(prop_name)
        kind = _property_kind(prop, serializer)
        default = prop._default

        if default is Undefined:
            prop_def = PropertyDef(name=prop_name, kind=kind)
        else:
            prop_def = PropertyDef(name=prop_name, kind=kind, default=_encode_default(descriptor, default, serializer))

        properties.append(prop_def)

    for prop_name, default in cls._overridden_defaults().items():
        prop = cls_properties.get(prop_name)
        if prop is None or not prop.serialized:
            continue

        base_descriptor = base.lookup(prop_name, raises=False)
        if base_descriptor is not None:
            base_default = base_descriptor.class_default(base, no_eval=True)
            if _same_default(prop, default, base_default):
                continue

        descriptor = cls.lookup(prop_name)
        overrides.append(OverrideDef(name=prop_name, default=_encode_default(descriptor, default, serializer)))

    modeldef = ModelDef(
        type="model",
        name=cls.__qualified_model__,
    )

    if extends is not None:
        modeldef["extends"] = extends
    if properties:
        modeldef["properties"] = properties
    if overrides:
        modeldef["overrides"] = overrides

    return modeldef

def _type_to_serializable(cls: type[Any], serializer: Serializer) -> Ref | ModelDef:
    if issubclass(cls, HasProps):
        return _HasProps_to_serializable(cls, serializer)
    serializer.error(f"can't serialize type {cls.__module__}.{cls.__qualname__}")

Serializer.register(type, _type_to_serializable)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_ABSTRACT_ADMONITION = '''
.. note::
    This is an abstract base class used to help organize the hierarchy of Bokeh
    model types. **It is not useful to instantiate on its own.**
'''

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
