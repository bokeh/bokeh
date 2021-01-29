#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
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
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import difflib
from typing import Any, Dict, Optional
from warnings import warn

# Bokeh imports
from ..util.string import nice_join
from .property.alias import Alias
from .property.descriptor_factory import PropertyDescriptorFactory
from .property.descriptors import PropertyDescriptor, UnsetValueError
from .property.override import Override
from .property.singletons import Undefined
from .property.wrappers import PropertyValueContainer

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'abstract',
    'accumulate_dict_from_superclasses',
    'accumulate_from_superclasses',
    'HasProps',
    'MetaHasProps',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def abstract(cls):
    ''' A decorator to mark abstract base classes derived from |HasProps|.

    '''
    if not issubclass(cls, HasProps):
        raise TypeError(f"{cls.__name__} is not a subclass of HasProps")

    # running python with -OO will discard docstrings -> __doc__ is None
    if cls.__doc__ is not None:
        cls.__doc__ += _ABSTRACT_ADMONITION

    return cls

def is_DataModel(cls):
    return issubclass(cls, HasProps) and getattr(cls, "__data_model__", False)

def _overridden_defaults(class_dict):
    overridden_defaults = {}
    for name, prop in tuple(class_dict.items()):
        if isinstance(prop, Override):
            del class_dict[name]
            if prop.default_overridden:
                overridden_defaults[name] = prop.default
    return overridden_defaults

def _generators(class_dict):
    generators = dict()
    for name, generator in tuple(class_dict.items()):
        if isinstance(generator, PropertyDescriptorFactory):
            del class_dict[name]
            generators[name] = generator
    return generators

def make_property(target_name, help):
    fget = lambda self: getattr(self, target_name)
    fset = lambda self, value: setattr(self, target_name, value)
    return property(fget, fset, None, help)

def _property_aliases(class_dict):
    property_aliases = {}
    for name, prop in tuple(class_dict.items()):
        if isinstance(prop, Alias):
            property_aliases[name] = prop.name
            class_dict[name] = make_property(prop.name, prop.help)
    return property_aliases

class MetaHasProps(type):
    ''' Specialize the construction of |HasProps| classes.

    This class is a `metaclass`_ for |HasProps| that is responsible for
    creating and adding the |PropertyDescriptor| instances that delegate
    validation and serialization to |Property| attributes.

    .. _metaclass: https://docs.python.org/3/reference/datamodel.html#metaclasses

    '''

    def __new__(meta_cls, class_name, bases, class_dict):
        '''

        '''
        overridden_defaults = _overridden_defaults(class_dict)
        property_aliases = _property_aliases(class_dict)
        generators = _generators(class_dict)

        names_with_refs = set()
        container_names = set()
        dataspecs = {}
        new_class_attrs = {}

        for name, generator in generators.items():
            prop_descriptors = generator.make_descriptors(name)
            for prop_descriptor in prop_descriptors:
                prop_descriptor.add_prop_descriptor_to_class(class_name, new_class_attrs, names_with_refs, container_names, dataspecs)

        class_dict.update(new_class_attrs)

        class_dict["__properties__"] = set(new_class_attrs)
        class_dict["__properties_with_refs__"] = names_with_refs
        class_dict["__container_props__"] = container_names
        class_dict["__property_aliases__"] = property_aliases
        class_dict["__overridden_defaults__"] = overridden_defaults
        class_dict["__dataspecs__"] = dataspecs

        return super().__new__(meta_cls, class_name, bases, class_dict)

    def __init__(cls, _, bases, __):
        # Check for improperly redeclaring a Property attribute.
        for base in bases:
            if not issubclass(base, HasProps):
                continue
            base_properties = base.properties()
            for attr in cls.__dict__: # we do NOT want inherited attrs here
                if attr in base_properties:
                    warn("Property {attr!r} in class {base.__name__} was redeclares by a class attribute "
                         "{attr!r} in class {class_name}; it never makes sense to do this. "
                          "Either {base.__name__}.{attr} or {class_name}.{attr} should be removed,"
                          "or Override() should be used to change a default value of a base class property.",
                         RuntimeWarning, stacklevel=2)

        # Check for no-op Overrides
        overridden_defaults = cls.__dict__["__overridden_defaults__"]
        if overridden_defaults:
            our_props = cls.properties()
            for key in overridden_defaults:
                if key not in our_props:
                    warn((f"Override() of {key} in class {cls.__name__} does not override anything."), RuntimeWarning, stacklevel=2)

def accumulate_from_superclasses(cls, propname):
    ''' Traverse the class hierarchy and accumulate the special sets of names
    ``MetaHasProps`` stores on classes:

    Args:
        name (str) : name of the special attribute to collect.

            Typically meaningful values are: ``__container_props__``,
            ``__properties__``, ``__properties_with_refs__``

    '''
    cachename = "__cached_all" + propname
    # we MUST use cls.__dict__ NOT hasattr(). hasattr() would also look at base
    # classes, and the cache must be separate for each class
    if cachename not in cls.__dict__:
        s = set()
        for c in cls.__mro__:
            if issubclass(c, HasProps) and hasattr(c, propname):
                base = getattr(c, propname)
                s.update(base)
        setattr(cls, cachename, s)
    return cls.__dict__[cachename]

def accumulate_dict_from_superclasses(cls, propname):
    ''' Traverse the class hierarchy and accumulate the special dicts
    ``MetaHasProps`` stores on classes:

    Args:
        name (str) : name of the special attribute to collect.

            Typically meaningful values are: ``__dataspecs__``,
            ``__overridden_defaults__``

    '''
    cachename = "__cached_all" + propname
    # we MUST use cls.__dict__ NOT hasattr(). hasattr() would also look at base
    # classes, and the cache must be separate for each class
    if cachename not in cls.__dict__:
        d = dict()
        for c in cls.__mro__:
            if issubclass(c, HasProps) and hasattr(c, propname):
                base = getattr(c, propname)
                for k,v in base.items():
                    if k not in d:
                        d[k] = v
        setattr(cls, cachename, d)
    return cls.__dict__[cachename]

class HasProps(metaclass=MetaHasProps):
    ''' Base class for all class types that have Bokeh properties.

    '''
    _initialized: bool = False

    def __init__(self, **properties):
        '''

        '''
        super().__init__()
        self._property_values = dict()
        self._unstable_default_values = dict()
        self._unstable_themed_values = dict()

        for name, value in properties.items():
            setattr(self, name, value)

        self._initialized = True

    def __setattr__(self, name, value):
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
        # self.properties() below can be expensive so avoid it
        # if we're just setting a private underscore field
        if name.startswith("_"):
            super().__setattr__(name, value)
            return

        props = sorted(self.properties())
        descriptor = getattr(self.__class__, name, None)

        if name in props or (descriptor is not None and descriptor.fset is not None):
            super().__setattr__(name, value)
        else:
            matches, text = difflib.get_close_matches(name.lower(), props), "similar"

            if not matches:
                matches, text = props, "possible"

            raise AttributeError(f"unexpected attribute {name!r} to {self.__class__.__name__}, {text} attributes are {nice_join(matches)}")

    def __str__(self) -> str:
        name = self.__class__.__name__
        return f"{name}(...)"

    __repr__ = __str__

    def equals(self, other):
        ''' Structural equality of models.

        Args:
            other (HasProps) : the other instance to compare to

        Returns:
            True, if properties are structurally equal, otherwise False

        '''

        # NOTE: don't try to use this to implement __eq__. Because then
        # you will be tempted to implement __hash__, which would interfere
        # with mutability of models. However, not implementing __hash__
        # will make bokeh unusable in Python 3, where proper implementation
        # of __hash__ is required when implementing __eq__.
        if not isinstance(other, self.__class__):
            return False
        else:
            return self.properties_with_values() == other.properties_with_values()

    # TODO: this assumes that HasProps/Model are defined as in bokehjs, which
    # isn't the case here. HasProps must be serializable through refs only.
    @classmethod
    def static_to_serializable(cls, serializer):
        # TODO: resolving already visited objects should be serializer's duty
        modelref = serializer.get_ref(cls)
        if modelref is not None:
            return modelref

        bases = [ basecls for basecls in cls.__bases__ if is_DataModel(basecls) ]
        if len(bases) == 0:
            extends = None
        elif len(bases) == 1:
            extends = bases[0].static_to_serializable(serializer)
        else:
            raise RuntimeError("multiple bases are not supported")

        name = cls.__view_model__
        module = cls.__view_module__

        # TODO: remove this
        if module == "__main__" or module.split(".")[0] == "bokeh":
            module = None

        properties = []
        overrides = []

        # TODO: don't use unordered sets
        for prop_name in list(cls.__properties__):
            descriptor = cls.lookup(prop_name)
            kind = None # TODO: serialize kinds
            default = descriptor.property._default # TODO: private member
            properties.append(dict(name=prop_name, kind=kind, default=default))

        for prop_name, default in getattr(cls, "__overridden_defaults__", {}).items():
            overrides.append(dict(name=prop_name, default=default))

        modeldef = dict(name=name, module=module, extends=extends, properties=properties, overrides=overrides)
        modelref = dict(name=name, module=module)

        serializer.add_ref(cls, modelref, modeldef)
        return modelref

    def to_serializable(self, serializer):
        pass # TODO: new serializer, hopefully in near future

    def set_from_json(self, name, json, models=None, setter=None):
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
        if name in self.properties():
            log.trace("Patching attribute %r of %r with %r", name, self, json)
            descriptor = self.lookup(name)
            descriptor.set_from_json(self, json, models, setter)
        else:
            log.warning("JSON had attr %r on obj %r, which is a client-only or invalid attribute that shouldn't have been sent", name, self)

    def update(self, **kwargs):
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
        for k,v in kwargs.items():
            setattr(self, k, v)

    def update_from_json(self, json_attributes, models=None, setter=None):
        ''' Updates the object's properties from a JSON attributes dictionary.

        Args:
            json_attributes: (JSON-dict) : attributes and values to update

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
        for k, v in json_attributes.items():
            self.set_from_json(k, v, models, setter)

    @classmethod
    def lookup(cls, name: str, *, raises: bool = True) -> Optional[PropertyDescriptor]:
        ''' Find the ``PropertyDescriptor`` for a Bokeh property on a class,
        given the property name.

        Args:
            name (str) : name of the property to search for
            raises (bool) : whether to raise or return None if missing

        Returns:
            PropertyDescriptor : descriptor for property named ``name``

        '''
        resolved_name = cls._property_aliases().get(name, name)
        attr = getattr(cls, resolved_name, None)
        if attr is not None:
            return attr
        elif not raises:
            return None
        else:
            raise AttributeError(f"{cls.__name__}.{name} property descriptor does not exist")

    @classmethod
    def properties_with_refs(cls):
        ''' Collect the names of all properties on this class that also have
        references.

        This method *always* traverses the class hierarchy and includes
        properties defined on any parent classes.

        Returns:
            set[str] : names of properties that have references

        '''
        return accumulate_from_superclasses(cls, "__properties_with_refs__")

    @classmethod
    def properties_containers(cls):
        ''' Collect the names of all container properties on this class.

        This method *always* traverses the class hierarchy and includes
        properties defined on any parent classes.

        Returns:
            set[str] : names of container properties

        '''
        return accumulate_from_superclasses(cls, "__container_props__")

    @classmethod
    def properties(cls, with_bases=True):
        ''' Collect the names of properties on this class.

        This method *optionally* traverses the class hierarchy and includes
        properties defined on any parent classes.

        Args:
            with_bases (bool, optional) :
                Whether to include properties defined on parent classes in
                the results. (default: True)

        Returns:
           set[str] : property names

        '''
        if with_bases:
            return accumulate_from_superclasses(cls, "__properties__")
        else:
            return set(cls.__properties__)

    @classmethod
    def dataspecs(cls):
        ''' Collect the names of all ``DataSpec`` properties on this class.

        This method *always* traverses the class hierarchy and includes
        properties defined on any parent classes.

        Returns:
            set[str] : names of ``DataSpec`` properties

        '''
        return set(cls.dataspecs_with_props().keys())

    @classmethod
    def dataspecs_with_props(cls):
        ''' Collect a dict mapping the names of all ``DataSpec`` properties
        on this class to the associated properties.

        This method *always* traverses the class hierarchy and includes
        properties defined on any parent classes.

        Returns:
            dict[str, DataSpec] : mapping of names and ``DataSpec`` properties

        '''
        return accumulate_dict_from_superclasses(cls, "__dataspecs__")

    def properties_with_values(self, *, include_defaults: bool = True, include_undefined: bool = False) -> Dict[str, Any]:
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
    def _overridden_defaults(cls):
        ''' Returns a dictionary of defaults that have been overridden.

        .. note::
            This is an implementation detail of ``Property``.

        '''
        return accumulate_dict_from_superclasses(cls, "__overridden_defaults__")

    @classmethod
    def _property_aliases(cls) -> Dict[str, str]:
        ''' Returns a dictionary of aliased properties.

        .. note::
            This is an implementation detail of ``Property``.
        '''
        return accumulate_dict_from_superclasses(cls, "__property_aliases__")

    def query_properties_with_values(self, query, *, include_defaults: bool = True, include_undefined: bool = False):
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
        themed_keys = set()
        result = dict()
        if include_defaults:
            keys = self.properties()
        else:
            # TODO (bev) For now, include unstable default values. Things rely on Instances
            # always getting serialized, even defaults, and adding unstable defaults here
            # accomplishes that. Unmodified defaults for property value containers will be
            # weeded out below.
            keys = set(self._property_values.keys()) | set(self._unstable_default_values.keys())
            if self.themed_values():
                themed_keys = set(self.themed_values().keys())
                keys |= themed_keys

        for key in keys:
            descriptor = self.lookup(key)
            if not query(descriptor):
                continue

            try:
                value = descriptor.serializable_value(self)
            except UnsetValueError:
                if include_undefined:
                    value = Undefined
                else:
                    continue
            else:
                if not include_defaults and key not in themed_keys:
                    if isinstance(value, PropertyValueContainer) and key in self._unstable_default_values:
                        continue

            result[key] = value

        return result

    def themed_values(self):
        ''' Get any theme-provided overrides.

        Results are returned as a dict from property name to value, or
        ``None`` if no theme overrides any values for this instance.

        Returns:
            dict or None

        '''
        return getattr(self, '__themed_values__', None)

    def apply_theme(self, property_values):
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

        removed = set()
        # we're doing a little song-and-dance to avoid storing __themed_values__ or
        # an empty dict, if there's no theme that applies to this HasProps instance.
        if old_dict is not None:
            removed.update(set(old_dict.keys()))
        added = set(property_values.keys())
        old_values = dict()
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
            descriptor.trigger_if_changed(self, v)

    def unapply_theme(self):
        ''' Remove any themed values and restore defaults.

        Returns:
            None

        '''
        self.apply_theme(property_values=dict())

    def _clone(self):
        ''' Duplicate a HasProps object.

        Values that are containers are shallow-copied.

        '''
        return self.__class__(**self._property_values)

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
