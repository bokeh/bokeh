#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import difflib
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    ClassVar,
    Iterable,
    Literal,
    NoReturn,
    TypedDict,
    TypeVar,
    Union,
    overload,
)
from weakref import WeakSet

if TYPE_CHECKING:
    F = TypeVar("F", bound=Callable[..., Any])
    def lru_cache(arg: int | None) -> Callable[[F], F]: ...
else:
    from functools import lru_cache

# Bokeh imports
from ..util.strings import append_docstring, nice_join
from ..util.warnings import warn
from .property.descriptor_factory import PropertyDescriptorFactory
from .property.descriptors import PropertyDescriptor, UnsetValueError
from .property.override import Override
from .property.singletons import Intrinsic, Undefined
from .property.wrappers import PropertyValueContainer
from .serialization import (
    ObjectRep,
    Ref,
    Serializable,
    Serializer,
)
from .types import ID

if TYPE_CHECKING:
    from typing_extensions import NotRequired, TypeAlias

    from ..client.session import ClientSession
    from ..server.session import ServerSession
    from .property.bases import Property
    from .property.dataspec import DataSpec

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'abstract',
    'HasProps',
    'MetaHasProps',
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
    Setter: TypeAlias = Union[ClientSession, ServerSession]

C = TypeVar("C", bound=type["HasProps"])

_abstract_classes: WeakSet[type[HasProps]] = WeakSet()

def abstract(cls: C) -> C:
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

def _overridden_defaults(class_dict: dict[str, Any]) -> dict[str, Any]:
    overridden_defaults: dict[str, Any] = {}
    for name, prop in tuple(class_dict.items()):
        if isinstance(prop, Override):
            del class_dict[name]
            if prop.default_overridden:
                overridden_defaults[name] = prop.default
    return overridden_defaults

def _generators(class_dict: dict[str, Any]):
    generators: dict[str, PropertyDescriptorFactory[Any]] = {}
    for name, generator in tuple(class_dict.items()):
        if isinstance(generator, PropertyDescriptorFactory):
            del class_dict[name]
            generators[name] = generator
    return generators

class _ModelResolver:
    """ """

    _known_models: dict[str, type[HasProps]]

    def __init__(self) -> None:
        self._known_models = {}

    def add(self, cls: type[HasProps]) -> None:
        if not (issubclass(cls, Local) or cls.__name__.startswith("_")):
            # update the mapping of view model names to classes, checking for any duplicates
            previous = self._known_models.get(cls.__qualified_model__, None)
            if previous is not None and not hasattr(cls, "__implementation__"):
                raise Warning(f"Duplicate qualified model declaration of '{cls.__qualified_model__}'. Previous definition: {previous}")
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

class MetaHasProps(type):
    ''' Specialize the construction of |HasProps| classes.

    This class is a `metaclass`_ for |HasProps| that is responsible for
    creating and adding the ``PropertyDescriptor`` instances that delegate
    validation and serialization to |Property| attributes.

    .. _metaclass: https://docs.python.org/3/reference/datamodel.html#metaclasses

    '''

    __properties__: dict[str, Property[Any]]
    __overridden_defaults__: dict[str, Any]
    __themed_values__: dict[str, Any]

    def __new__(cls, class_name: str, bases: tuple[type, ...], class_dict: dict[str, Any]):
        '''

        '''
        overridden_defaults = _overridden_defaults(class_dict)
        generators = _generators(class_dict)

        properties = {}

        for name, generator in generators.items():
            descriptors = generator.make_descriptors(name)
            for descriptor in descriptors:
                name = descriptor.name
                if name in class_dict:
                    raise RuntimeError(f"Two property generators both created {class_name}.{name}")
                class_dict[name] = descriptor
                properties[name] = descriptor.property

        class_dict["__properties__"] = properties
        class_dict["__overridden_defaults__"] = overridden_defaults

        return super().__new__(cls, class_name, bases, class_dict)

    def __init__(cls, class_name: str, bases: tuple[type, ...], _) -> None:
        # HasProps itself may not have any properties defined
        if class_name == "HasProps":
            return

        # Check for improperly redeclared a Property attribute.
        base_properties: dict[str, Any] = {}
        for base in (x for x in bases if issubclass(x, HasProps)):
            base_properties.update(base.properties(_with_props=True))
        own_properties = {k: v for k, v in cls.__dict__.items() if isinstance(v, PropertyDescriptor)}
        redeclared = own_properties.keys() & base_properties.keys()
        if redeclared:
            warn(f"Properties {redeclared!r} in class {cls.__name__} were previously declared on a parent "
                 "class. It never makes sense to do this. Redundant properties should be deleted here, or on "
                 "the parent class. Override() can be used to change a default value of a base class property.",
                 RuntimeWarning)

        # Check for no-op Overrides
        unused_overrides = cls.__overridden_defaults__.keys() - cls.properties(_with_props=True).keys()
        if unused_overrides:
            warn(f"Overrides of {unused_overrides} in class {cls.__name__} does not override anything.", RuntimeWarning)

    @property
    def model_class_reverse_map(cls) -> dict[str, type[HasProps]]:
        return _default_resolver.known_models

class Local:
    """Don't register this class in model registry. """

class Qualified:
    """Resolve this class by a fully qualified name. """

class NonQualified:
    """Resolve this class by a non-qualified name. """

class HasProps(Serializable, metaclass=MetaHasProps):
    ''' Base class for all class types that have Bokeh properties.

    '''
    _initialized: bool = False

    _property_values: dict[str, Any]
    _unstable_default_values: dict[str, Any]
    _unstable_themed_values: dict[str, Any]

    __view_model__: ClassVar[str]
    __view_module__: ClassVar[str]
    __qualified_model__: ClassVar[str]
    __implementation__: ClassVar[Any] # TODO: specific type
    __data_model__: ClassVar[bool]

    @classmethod
    def __init_subclass__(cls):
        super().__init_subclass__()

        # use an explicitly provided view model name if there is one
        if "__view_model__" not in cls.__dict__:
            cls.__view_model__ = cls.__qualname__.replace("<locals>.", "")
        if "__view_module__" not in cls.__dict__:
            cls.__view_module__ = cls.__module__

        if "__qualified_model__" not in cls.__dict__:
            def qualified():
                module = cls.__view_module__
                model = cls.__view_model__

                if issubclass(cls, NonQualified):
                    return model

                if not issubclass(cls, Qualified):
                    head = module.split(".")[0]
                    if head == "bokeh" or head == "__main__" or "__implementation__" in cls.__dict__:
                        return model

                return f"{module}.{model}"

            cls.__qualified_model__ = qualified()

        _default_resolver.add(cls)

    def __init__(self, **properties: Any) -> None:
        '''

        '''
        super().__init__()
        self._property_values = {}
        self._unstable_default_values = {}
        self._unstable_themed_values = {}

        for name, value in properties.items():
            # TODO: this would be better to handle in descriptors
            if value is Undefined or value is Intrinsic:
                continue
            setattr(self, name, value)

        initialized = set(properties.keys())
        for name in self.properties(_with_props=True): # avoid set[] for deterministic behavior
            if name in initialized:
                continue
            desc = self.lookup(name)
            if desc.has_unstable_default(self):
                desc._get(self) # this fills-in `_unstable_*_values`

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

        properties = self.properties(_with_props=True)
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

        properties = self.properties(_with_props=True)
        if name in properties:
            return super().__getattribute__(name)

        descriptor = getattr(self.__class__, name, None)
        if isinstance(descriptor, property): # Python property
            return super().__getattribute__(name)

        self._raise_attribute_error_with_matches(name, properties)

    def _raise_attribute_error_with_matches(self, name: str, properties: Iterable[str]) -> NoReturn:
        matches, text = difflib.get_close_matches(name.lower(), properties), "similar"

        if not matches:
            matches, text = sorted(properties), "possible"

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

        properties = self.properties_with_values(include_defaults=False)
        attributes = {key: serializer.encode(val) for key, val in properties.items()}

        if attributes:
            rep["attributes"] = attributes

        return rep

    # FQ type name required to suppress Sphinx error "more than one target found for cross-reference 'JSON'"
    def set_from_json(self, name: str, value: Any, *, setter: Setter | None = None) -> None:
        ''' Set a property value on this object from JSON.

        Args:
            name: (str) : name of the attribute to set

            json: (JSON-value) : value to set to the attribute to

            models (dict or None, optional) :
                Mapping of model ids to models (default: None)

                This is needed in cases where the attributes to update also
                have values that have references.

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
        if name in self.properties(_with_props=True):
            log.trace(f"Patching attribute {name!r} of {self!r} with {value!r}") # type: ignore # TODO: log.trace()
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

    @overload
    @classmethod
    @lru_cache(None)
    def properties(cls, *, _with_props: Literal[False] = False) -> set[str]: ...

    @overload
    @classmethod
    @lru_cache(None)
    def properties(cls, *, _with_props: Literal[True] = True) -> dict[str, Property[Any]]: ...

    @classmethod
    @lru_cache(None)
    def properties(cls, *, _with_props: bool = False) -> set[str] | dict[str, Property[Any]]:
        ''' Collect the names of properties on this class.

        .. warning::
            In a future version of Bokeh, this method will return a dictionary
            mapping property names to property objects. To future-proof this
            current usage of this method, wrap the return value in ``list``.

        Returns:
            property names

        '''
        props: dict[str, Property[Any]] = {}
        for c in reversed(cls.__mro__):
            props.update(getattr(c, "__properties__", {}))

        if not _with_props:
            return set(props)

        return props

    @classmethod
    @lru_cache(None)
    def descriptors(cls) -> list[PropertyDescriptor[Any]]:
        """ List of property descriptors in the order of definition. """
        return [ cls.lookup(name) for name, _ in cls.properties(_with_props=True).items() ]

    @classmethod
    @lru_cache(None)
    def properties_with_refs(cls) -> dict[str, Property[Any]]:
        ''' Collect the names of all properties on this class that also have
        references.

        This method *always* traverses the class hierarchy and includes
        properties defined on any parent classes.

        Returns:
            set[str] : names of properties that have references

        '''
        return {k: v for k, v in cls.properties(_with_props=True).items() if v.has_ref}

    @classmethod
    @lru_cache(None)
    def dataspecs(cls) -> dict[str, DataSpec]:
        ''' Collect the names of all ``DataSpec`` properties on this class.

        This method *always* traverses the class hierarchy and includes
        properties defined on any parent classes.

        Returns:
            set[str] : names of ``DataSpec`` properties

        '''
        from .property.dataspec import DataSpec  # avoid circular import
        return {k: v for k, v in cls.properties(_with_props=True).items() if isinstance(v, DataSpec)}

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
    def _overridden_defaults(cls) -> dict[str, Any]:
        ''' Returns a dictionary of defaults that have been overridden.

        .. note::
            This is an implementation detail of ``Property``.

        '''
        defaults: dict[str, Any] = {}
        for c in reversed(cls.__mro__):
            defaults.update(getattr(c, "__overridden_defaults__", {}))
        return defaults

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
        themed_keys: set[str] = set()
        result: dict[str, Any] = {}

        keys = self.properties(_with_props=True)
        if include_defaults:
            selected_keys = set(keys)
        else:
            # TODO (bev) For now, include unstable default values. Things rely on Instances
            # always getting serialized, even defaults, and adding unstable defaults here
            # accomplishes that. Unmodified defaults for property value containers will be
            # weeded out below.
            selected_keys = set(self._property_values.keys()) | set(self._unstable_default_values.keys())
            themed_values = self.themed_values()
            if themed_values is not None:
                themed_keys = set(themed_values.keys())
                selected_keys |= themed_keys

        for key in keys:
            descriptor = self.lookup(key)
            if not query(descriptor):
                continue

            try:
                value = descriptor.get_value(self)
            except UnsetValueError:
                if include_undefined:
                    value = Undefined
                else:
                    raise
            else:
                # TODO: this should happen before get_value(), however there's currently
                # no reliable way of checking if a property is unset without actually
                # getting the value.
                if key not in selected_keys:
                    continue

                if not include_defaults and key not in themed_keys:
                    if isinstance(value, PropertyValueContainer) and key in self._unstable_default_values:
                        continue

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
        if old_dict is property_values:  # lgtm [py/comparison-using-is]
            return

        removed: set[str] = set()
        # we're doing a little song-and-dance to avoid storing __themed_values__ or
        # an empty dict, if there's no theme that applies to this HasProps instance.
        if old_dict is not None:
            removed.update(set(old_dict.keys()))
        added = set(property_values.keys())
        old_values: dict[str, Any] = {}
        for k in added.union(removed):
            old_values[k] = getattr(self, k)

        if len(property_values) > 0:
            setattr(self, '__themed_values__', property_values)
        elif hasattr(self, '__themed_values__'):
            delattr(self, '__themed_values__')

        # Property container values might be cached even if unmodified. Invalidate
        # any cached values that are not modified at this point.
        for k, v in old_values.items():
            if k in self._unstable_themed_values:
                del self._unstable_themed_values[k]

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

    def clone(self) -> HasProps:
        ''' Duplicate a HasProps object.

        This creates a shallow clone of the original model, i.e. any
        mutable containers or child models will not be duplicated.

        '''
        attrs = self.properties_with_values(include_defaults=False, include_undefined=True)
        return self.__class__(**{key: val for key, val in attrs.items() if val is not Undefined})

KindRef = Any # TODO

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

def _HasProps_to_serializable(cls: type[HasProps], serializer: Serializer) -> Ref | ModelDef:
    from ..model import DataModel, Model

    ref = Ref(id=ID(cls.__qualified_model__))
    serializer.add_ref(cls, ref)

    if not is_DataModel(cls):
        return ref

    # TODO: consider supporting mixin models
    bases: list[type[HasProps]] = [ base for base in cls.__bases__ if issubclass(base, Model) and base != DataModel ]
    if len(bases) == 0:
        extends = None
    elif len(bases) == 1:
        [base] = bases
        extends = serializer.encode(base)
    else:
        serializer.error("multiple bases are not supported")

    properties: list[PropertyDef] = []
    overrides: list[OverrideDef] = []

    # TODO: don't use unordered sets
    for prop_name in cls.__properties__:
        descriptor = cls.lookup(prop_name)
        kind = "Any" # TODO: serialize kinds
        default = descriptor.property._default

        if default is Undefined:
            prop_def = PropertyDef(name=prop_name, kind=kind)
        else:
            if descriptor.is_unstable(default):
                default = default()

            prop_def = PropertyDef(name=prop_name, kind=kind, default=serializer.encode(default))

        properties.append(prop_def)

    for prop_name, default in getattr(cls, "__overridden_defaults__", {}).items():
        overrides.append(OverrideDef(name=prop_name, default=serializer.encode(default)))

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

Serializer.register(MetaHasProps, _HasProps_to_serializable)

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
