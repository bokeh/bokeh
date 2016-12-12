""" Properties are objects that can be assigned as class level
attributes on Bokeh models, to provide automatic serialization
and validation.

For example, the following defines a model that has integer,
string, and list[float] properties:

.. code-block:: python

    class Model(HasProps):
        foo = Int
        bar = String
        baz = List(Float)

The properties of this class can be initialized by specifying
keyword arguments to the initializer:

.. code-block:: python

    m = Model(foo=10, bar="a str", baz=[1,2,3,4])

But also by setting the attributes on an instance:

.. code-block:: python

    m.foo = 20

Attempts to set a property to a value of the wrong type will
result in a ``ValueError`` exception:

.. code-block:: python

    >>> m.foo = 2.3
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
      File "/Users/bryan/work/bokeh/bokeh/properties.py", line 585, in __setattr__
        super(HasProps, self).__setattr__(name, value)
      File "/Users/bryan/work/bokeh/bokeh/properties.py", line 159, in __set__
        raise e
      File "/Users/bryan/work/bokeh/bokeh/properties.py", line 152, in __set__
        self.validate(value)
      File "/Users/bryan/work/bokeh/bokeh/properties.py", line 707, in validate
        (nice_join([ cls.__name__ for cls in self._underlying_type ]), value, type(value).__name__))
    ValueError: expected a value of type int8, int16, int32, int64 or int, got 2.3 of type float

Additionally, properties know how to serialize themselves, to be understood
by BokehJS.

"""
from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__name__)

import collections
from copy import copy
import datetime
import dateutil.parser
import difflib
from importlib import import_module
import inspect
import numbers
import re
import sys
import types
from warnings import warn
from operator import itemgetter

from six import string_types, iteritems, StringIO

from ..colors import RGB
from ..util.dependencies import import_optional
from ..util.deprecation import deprecated
from ..util.future import with_metaclass
from ..util.string import nice_join
from .property_containers import PropertyValueList, PropertyValueDict, PropertyValueContainer
from . import enums

pd = import_optional('pandas')
IPython = import_optional('IPython')

def field(name):
    ''' Convenience function do explicitly mark a field specification for
    a Bokeh model property.

    Args:
        name (str) : name of a data source field to reference for a property.

    Returns:
        dict : ``{"field": name}``

    Note:
        This function is included for completeness. String values for
        property specifications are by default interpreted as field names.

    '''
    return dict(field=name)

def value(val):
    ''' Convenience function do explicitly mark a value specification for
    a Bokeh model property.

    Args:
        val (any) : a fixed value to specify for a property.

    Returns:
        dict : ``{"value": name}``

    Note:
        String values for property specifications are by default interpreted
        as field names. This function is especially useful when you want to
        specify a fixed value with text properties.

    Example:

    .. code-block:: python

        # The following will take text values to render from a data source
        # column "text_column", but use a fixed value "12pt" for font size
        p.text("x", "y", text="text_column",
               text_font_size=value("12pt"), source=source)

    '''
    return dict(value=val)

bokeh_bool_types = (bool,)
try:
    import numpy as np
    bokeh_bool_types += (np.bool8,)
except ImportError:
    pass

bokeh_integer_types = (numbers.Integral,)

# used to indicate properties that are not set (vs null, None, etc)
class _NotSet(object):
    pass

class DeserializationError(Exception):
    pass

class PropertyFactory(object):
    """ Base class for objects that can generate Property instances. """

    @classmethod
    def autocreate(cls):
        """ Called by the metaclass to create a
        new instance of this descriptor
        if the user just assigned it to a property without trailing
        parentheses.
        """
        return cls()

    def make_properties(self, base_name):
        """ Returns a list of Property instances. """
        raise NotImplementedError("make_properties not implemented")

class PropertyDescriptor(PropertyFactory):
    """ Base class for a description of a property, not associated yet with an attribute name or a class."""

    def __init__(self, default=None, help=None, serialized=True):
        """ This is how the descriptor is created in the class declaration. """
        self._serialized = serialized
        self._default = default
        self.__doc__ = help
        self.alternatives = []

        # "fail early" when a default is invalid
        self.validate(self._raw_default())

    def __str__(self):
        return self.__class__.__name__

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__

    def make_properties(self, base_name):
        return [ BasicProperty(descriptor=self, name=base_name) ]

    def _has_stable_default(self):
        """ True if we have a default that will be the same every time and is not mutable."""
        if isinstance(self._default, types.FunctionType):
            return False
        else:
            return True

    @classmethod
    def _copy_default(cls, default):
        if not isinstance(default, types.FunctionType):
            return copy(default)
        else:
            return default()

    def _raw_default(self):
        """ The raw_default() needs to be validated and transformed by prepare_value() before
        use, and may also be replaced later by subclass overrides or by themes."""
        return self._copy_default(self._default)

    def themed_default(self, cls, name, theme_overrides):
        """The default transformed by prepare_value() and the theme overrides."""
        overrides = theme_overrides
        if overrides is None or name not in overrides:
            overrides = cls._overridden_defaults()

        if name in overrides:
            default = self._copy_default(overrides[name])
        else:
            default = self._raw_default()
        return self.prepare_value(cls, name, default)

    @property
    def serialized(self):
        """True if the property should be serialized when serializing an object.
        This would be False for a "virtual" or "convenience" property that duplicates
        information already available in other properties, for example.
        """
        return self._serialized

    def matches(self, new, old):
        # XXX: originally this code warned about not being able to compare values, but that
        # doesn't make sense, because most comparisons involving numpy arrays will fail with
        # ValueError exception, thus warning about inevitable.
        try:
            if new is None or old is None:
                return new is old           # XXX: silence FutureWarning from NumPy
            else:
                return new == old
        except (KeyboardInterrupt, SystemExit):
            raise
        except Exception:
            # if we cannot compare (e.g. arrays) just punt return False for match
            pass
        return False

    def from_json(self, json, models=None):
        """ Convert from JSON-compatible values (list, dict, number, string, bool, None)
        into a value for this property."""
        return json

    def transform(self, value):
        """Change the value into the canonical format for this property."""
        return value

    def validate(self, value):
        """Check whether we can set this property from this value (called before transform())."""
        pass

    def is_valid(self, value):
        try:
            self.validate(value)
        except ValueError:
            return False
        else:
            return True

    @classmethod
    def _wrap_container(cls, value):
        if isinstance(value, list):
            if isinstance(value, PropertyValueList):
                return value
            else:
                return PropertyValueList(value)
        elif isinstance(value, dict):
            if isinstance(value, PropertyValueDict):
                return value
            else:
                return PropertyValueDict(value)
        else:
            return value

    def prepare_value(self, cls, name, value):
        try:
            self.validate(value)
        except ValueError as e:
            for tp, converter in self.alternatives:
                if tp.is_valid(value):
                    value = converter(value)
                    break
            else:
                raise e
        else:
            value = self.transform(value)

        return self._wrap_container(value)

    @property
    def has_ref(self):
        return False

    def accepts(self, tp, converter):
        tp = ParameterizedPropertyDescriptor._validate_type_param(tp)
        self.alternatives.append((tp, converter))
        return self

    def __or__(self, other):
        return Either(self, other)

class Property(object):
    """ A named attribute that can be read and written. """

    def __init__(self, name):
        self.name = name

    def __str__(self):
        return "Property(%s)" % (self.name)

    def __get__(self, obj, owner=None):
        raise NotImplementedError("Implement __get__")

    def __set__(self, obj, value):
        raise NotImplementedError("Implement __set__")

    def __delete__(self, obj):
        raise NotImplementedError("Implement __delete__")

    def class_default(self, cls):
        """ The default as computed for a certain class, ignoring any per-instance theming."""
        raise NotImplementedError("Implement class_default()")

    def serializable_value(self, obj):
        """Gets the value as it should be serialized, which differs from
        the __get__ value occasionally when we allow the __get__
        value to appear simpler for developer convenience.

        """
        return self.__get__(obj)

    def set_from_json(self, obj, json, models):
        """Sets from a JSON value.
        """
        return self.__set__(obj, json)

    @property
    def serialized(self):
        """ True if the property should be serialized when serializing an object.
        This would be False for a "virtual" or "convenience" property that duplicates
        information already available in other properties, for example.
        """
        raise NotImplementedError("Implement serialized()")

    @property
    def has_ref(self):
        """ True if the property can refer to another HasProps instance."""
        raise NotImplementedError("Implement has_ref()")

    def trigger_if_changed(self, obj, old):
        """ Send a change event if the property's value is not equal to ``old``. """
        raise NotImplementedError("Implement trigger_if_changed()")

class BasicProperty(Property):
    """ A PropertyDescriptor associated with a class attribute name, so it can be read and written. """

    def __init__(self, descriptor, name):
        super(BasicProperty, self).__init__(name)
        self.descriptor = descriptor
        self.__doc__ = self.descriptor.__doc__

    def __str__(self):
        return "%s" % self.descriptor

    def class_default(self, cls):
        """Get the default value for a specific subtype of HasProps,
        which may not be used for an individual instance."""
        return self.descriptor.themed_default(cls, self.name, None)

    def instance_default(self, obj):
        """ Get the default value that will be used for a specific instance."""
        return self.descriptor.themed_default(obj.__class__, self.name, obj.themed_values())

    @property
    def serialized(self):
        return self.descriptor.serialized

    def set_from_json(self, obj, json, models=None):
        """Sets using the result of serializable_value().
        """
        return super(BasicProperty, self).set_from_json(obj,
                                                        self.descriptor.from_json(json, models),
                                                        models)

    def _sphinx_type(self):
        return self.descriptor._sphinx_type()

    @property
    def has_ref(self):
        return self.descriptor.has_ref

    def _get(self, obj):
        if not hasattr(obj, '_property_values'):
            raise RuntimeError("Cannot get a property value '%s' from a %s instance before HasProps.__init__" %
                               (self.name, obj.__class__.__name__))

        if self.name not in obj._property_values:
            return self._get_default(obj)
        else:
            return obj._property_values[self.name]

    def __get__(self, obj, owner=None):
        if obj is not None:
            return self._get(obj)
        elif owner is not None:
            return self
        else:
            raise ValueError("both 'obj' and 'owner' are None, don't know what to do")

    def _trigger(self, obj, old, value, hint=None):
        if hasattr(obj, 'trigger'):
            obj.trigger(self.name, old, value, hint)

    def _get_default(self, obj):
        if self.name in obj._property_values:
            # this shouldn't happen because we should have checked before _get_default()
            raise RuntimeError("Bokeh internal error, does not handle the case of self.name already in _property_values")

        # merely getting a default may force us to put it in
        # _property_values if we need to wrap the container, if
        # the default is a Model that may change out from
        # underneath us, or if the default is generated anew each
        # time by a function.
        default = self.instance_default(obj)
        if not self.descriptor._has_stable_default():
            if isinstance(default, PropertyValueContainer):
                # this is a special-case so we can avoid returning the container
                # as a non-default or application-overridden value, when
                # it has not been modified.
                default._unmodified_default_value = True
                default._register_owner(obj, self)

            obj._property_values[self.name] = default

        return default

    def _real_set(self, obj, old, value, hint=None):
        # Currently as of Bokeh 0.11.1, all hinted events modify in place. However this may
        # need refining later if this assumption changes.
        unchanged = self.descriptor.matches(value, old) and (hint is None)
        if unchanged:
            return

        was_set = self.name in obj._property_values

        # "old" is the logical old value, but it may not be
        # the actual current attribute value if our value
        # was mutated behind our back and we got _notify_mutated.
        if was_set:
            old_attr_value = obj._property_values[self.name]
        else:
            old_attr_value = old

        if old_attr_value is not value:
            if isinstance(old_attr_value, PropertyValueContainer):
                old_attr_value._unregister_owner(obj, self)
            if isinstance(value, PropertyValueContainer):
                value._register_owner(obj, self)

            obj._property_values[self.name] = value

        # for notification purposes, "old" should be the logical old
        self._trigger(obj, old, value, hint)

    def __set__(self, obj, value):
        if not hasattr(obj, '_property_values'):
            # Initial values should be passed in to __init__, not set directly
            raise RuntimeError("Cannot set a property value '%s' on a %s instance before HasProps.__init__" %
                               (self.name, obj.__class__.__name__))
        value = self.descriptor.prepare_value(obj.__class__, self.name, value)

        old = self.__get__(obj)
        self._real_set(obj, old, value)

    # called when a container is mutated "behind our back" and
    # we detect it with our collection wrappers. In this case,
    # somewhat weirdly, "old" is a copy and the new "value"
    # should already be set unless we change it due to
    # validation.
    def _notify_mutated(self, obj, old, hint=None):
        value = self.__get__(obj)

        # re-validate because the contents of 'old' have changed,
        # in some cases this could give us a new object for the value
        value = self.descriptor.prepare_value(obj.__class__, self.name, value)

        self._real_set(obj, old, value, hint)

    def __delete__(self, obj):
        if self.name in obj._property_values:
            del obj._property_values[self.name]


    def trigger_if_changed(self, obj, old):
        new_value = self.__get__(obj)
        if not self.descriptor.matches(old, new_value):
            self._trigger(obj, old, new_value)

class Include(PropertyFactory):
    """ Include other properties from mixin Models, with a given prefix. """

    def __init__(self, delegate, help="", use_prefix=True):
        if not (isinstance(delegate, type) and issubclass(delegate, HasProps)):
            raise ValueError("expected a subclass of HasProps, got %r" % delegate)

        self.delegate = delegate
        self.help = help
        self.use_prefix = use_prefix

    def make_properties(self, base_name):
        props = []
        delegate = self.delegate
        if self.use_prefix:
            prefix = re.sub("_props$", "", base_name) + "_"
        else:
            prefix = ""

        # it would be better if we kept the original generators from
        # the delegate and built our Include props from those, perhaps.
        for subpropname in delegate.properties(with_bases=False):
            fullpropname = prefix + subpropname
            subprop = delegate.lookup(subpropname)
            if isinstance(subprop, BasicProperty):
                descriptor = copy(subprop.descriptor)
                if "%s" in self.help:
                    doc = self.help % subpropname.replace('_', ' ')
                else:
                    doc = self.help
                descriptor.__doc__ = doc
                props += descriptor.make_properties(fullpropname)

        return props

class Override(object):
    """ Override aspects of the PropertyDescriptor from a superclass. """

    def __init__(self, **kwargs):
        if len(kwargs) == 0:
            raise ValueError("Override() doesn't override anything, needs keyword args")
        self.default_overridden = 'default' in kwargs
        if self.default_overridden:
            self.default = kwargs.pop('default')
        if len(kwargs) > 0:
            raise ValueError("Unknown keyword args to Override: %r" % (kwargs))

_EXAMPLE_TEMPLATE = """

    Example
    -------

    .. bokeh-plot:: ../%(path)s
        :source-position: none

    *source:* `%(path)s <https://github.com/bokeh/bokeh/tree/master/%(path)s>`_

"""

class MetaHasProps(type):
    def __new__(meta_cls, class_name, bases, class_dict):
        names = set()
        names_with_refs = set()
        container_names = set()

        # Now handle all the Override
        overridden_defaults = {}
        for name, prop in class_dict.items():
            if not isinstance(prop, Override):
                continue
            if prop.default_overridden:
                overridden_defaults[name] = prop.default

        for name, default in overridden_defaults.items():
            del class_dict[name]

        generators = dict()
        for name, generator in class_dict.items():
            if isinstance(generator, PropertyFactory):
                generators[name] = generator
            elif isinstance(generator, type) and issubclass(generator, PropertyFactory):
                # Support the user adding a property without using parens,
                # i.e. using just the Property subclass instead of an
                # instance of the subclass
                generators[name] = generator.autocreate()

        dataspecs = {}
        new_class_attrs = {}

        def add_prop(prop):
            name = prop.name
            if name in new_class_attrs:
                raise RuntimeError("Two property generators both created %s.%s" % (class_name, name))
            new_class_attrs[name] = prop
            names.add(name)

            if prop.has_ref:
                names_with_refs.add(name)

            if isinstance(prop, BasicProperty):
                if isinstance(prop.descriptor, ContainerProperty):
                    container_names.add(name)

                if isinstance(prop.descriptor, DataSpec):
                    dataspecs[name] = prop

        for name, generator in generators.items():
            props = generator.make_properties(name)
            replaced_self = False
            for prop in props:
                if prop.name in generators:
                    if generators[prop.name] is generator:
                        # a generator can replace itself, this is the
                        # standard case like `foo = Int()`
                        replaced_self = True
                        add_prop(prop)
                    else:
                        # if a generator tries to overwrite another
                        # generator that's been explicitly provided,
                        # use the prop that was manually provided
                        # and ignore this one.
                        pass
                else:
                    add_prop(prop)
            # if we won't overwrite ourselves anyway, delete the generator
            if not replaced_self:
                del class_dict[name]

        class_dict.update(new_class_attrs)

        class_dict["__properties__"] = names
        class_dict["__properties_with_refs__"] = names_with_refs
        class_dict["__container_props__"] = container_names
        if len(overridden_defaults) > 0:
            class_dict["__overridden_defaults__"] = overridden_defaults
        if dataspecs:
            class_dict["__dataspecs__"] = dataspecs

        if "__example__" in class_dict:
            path = class_dict["__example__"]
            class_dict["__doc__"] += _EXAMPLE_TEMPLATE % dict(path=path)

        return super(MetaHasProps, meta_cls).__new__(meta_cls, class_name, bases, class_dict)

    def __init__(cls, class_name, bases, nmspc):
        if class_name == 'HasProps':
            return
        # Check for improperly overriding a Property attribute.
        # Overriding makes no sense except through the Override
        # class which can be used to tweak the default.
        # Historically code also tried changing the Property's
        # type or changing from Property to non-Property: these
        # overrides are bad conceptually because the type of a
        # read-write property is invariant.
        cls_attrs = cls.__dict__.keys() # we do NOT want inherited attrs here
        for attr in cls_attrs:
            for base in bases:
                if issubclass(base, HasProps) and attr in base.properties():
                    warn(('Property "%s" in class %s was overridden by a class attribute ' + \
                          '"%s" in class %s; it never makes sense to do this. ' + \
                          'Either %s.%s or %s.%s should be removed, or %s.%s should not ' + \
                          'be a Property, or use Override(), depending on the intended effect.') %
                         (attr, base.__name__, attr, class_name,
                          base.__name__, attr,
                          class_name, attr,
                          base.__name__, attr),
                         RuntimeWarning, stacklevel=2)

        if "__overridden_defaults__" in cls.__dict__:
            our_props = cls.properties()
            for key in cls.__dict__["__overridden_defaults__"].keys():
                if key not in our_props:
                    warn(('Override() of %s in class %s does not override anything.') % (key, class_name),
                         RuntimeWarning, stacklevel=2)

def accumulate_from_superclasses(cls, propname):
    cachename = "__cached_all" + propname
    # we MUST use cls.__dict__ NOT hasattr(). hasattr() would also look at base
    # classes, and the cache must be separate for each class
    if cachename not in cls.__dict__:
        s = set()
        for c in inspect.getmro(cls):
            if issubclass(c, HasProps) and hasattr(c, propname):
                base = getattr(c, propname)
                s.update(base)
        setattr(cls, cachename, s)
    return cls.__dict__[cachename]

def accumulate_dict_from_superclasses(cls, propname):
    cachename = "__cached_all" + propname
    # we MUST use cls.__dict__ NOT hasattr(). hasattr() would also look at base
    # classes, and the cache must be separate for each class
    if cachename not in cls.__dict__:
        d = dict()
        for c in inspect.getmro(cls):
            if issubclass(c, HasProps) and hasattr(c, propname):
                base = getattr(c, propname)
                for k,v in base.items():
                    if k not in d:
                        d[k] = v
        setattr(cls, cachename, d)
    return cls.__dict__[cachename]

def abstract(cls):
    """ A phony decorator to mark abstract base classes. """
    if not issubclass(cls, HasProps):
        raise TypeError("%s is not a subclass of HasProps" % cls.__name__)

    return cls

class HasProps(with_metaclass(MetaHasProps, object)):
    ''' Base class for all class types that have Bokeh properties.

    '''
    def __init__(self, **properties):
        super(HasProps, self).__init__()
        self._property_values = dict()

        for name, value in properties.items():
            setattr(self, name, value)

    def equals(self, other):
        """ Structural equality of models. """
        # NOTE: don't try to use this to implement __eq__. Because then
        # you will be tempted to implement __hash__, which would interfere
        # with mutability of models. However, not implementing __hash__
        # will make bokeh unusable in Python 3, where proper implementation
        # of __hash__ is required when implementing __eq__.
        if not isinstance(other, self.__class__):
            return False
        else:
            return self.properties_with_values() == other.properties_with_values()

    def __setattr__(self, name, value):
        # self.properties() below can be expensive so avoid it
        # if we're just setting a private underscore field
        if name.startswith("_"):
            super(HasProps, self).__setattr__(name, value)
            return

        props = sorted(self.properties())
        deprecated = getattr(self, '__deprecated_attributes__', [])

        if name in props or name in deprecated:
            super(HasProps, self).__setattr__(name, value)
        else:
            matches, text = difflib.get_close_matches(name.lower(), props), "similar"

            if not matches:
                matches, text = props, "possible"

            raise AttributeError("unexpected attribute '%s' to %s, %s attributes are %s" %
                (name, self.__class__.__name__, text, nice_join(matches)))

    def set_from_json(self, name, json, models=None):
        """ Sets a property of the object using JSON and a dictionary mapping
        model ids to model instances. The model instances are necessary if the
        JSON contains references to models.

        """
        if name in self.properties():
            #logger.debug("Patching attribute %s of %r", attr, patched_obj)
            prop = self.lookup(name)
            prop.set_from_json(self, json, models)
        else:
            logger.warn("JSON had attr %r on obj %r, which is a client-only or invalid attribute that shouldn't have been sent", name, self)

    def update(self, **kwargs):
        """ Updates the object's properties from the given keyword args. """
        for k,v in kwargs.items():
            setattr(self, k, v)

    def update_from_json(self, json_attributes, models=None):
        """ Updates the object's properties from a JSON attributes dictionary. """
        for k, v in json_attributes.items():
            self.set_from_json(k, v, models)

    def _clone(self):
        """ Returns a duplicate of this object with all its properties
        set appropriately.  Values which are containers are shallow-copied.
        """
        return self.__class__(**self._property_values)

    @classmethod
    def lookup(cls, name):
        return getattr(cls, name)

    @classmethod
    def properties_with_refs(cls):
        """ Return a set of the names of this object's properties that
        have references. We traverse the class hierarchy and
        pull together the full list of properties.
        """
        return accumulate_from_superclasses(cls, "__properties_with_refs__")

    @classmethod
    def properties_containers(cls):
        """ Returns a list of properties that are containers.
        """
        return accumulate_from_superclasses(cls, "__container_props__")

    @classmethod
    def properties(cls, with_bases=True):
        """Return a set of the names of this object's properties. If
        ``with_bases`` is True, we traverse the class hierarchy
        and pull together the full list of properties; if False,
        we only return the properties introduced in the class
        itself.

        Args:
           with_bases (bool, optional) :
            Whether to include properties that haven't been set. (default: True)

        Returns:
           a set of property names

        """
        if with_bases:
            return accumulate_from_superclasses(cls, "__properties__")
        else:
            return set(cls.__properties__)

    @classmethod
    def _overridden_defaults(cls):
        """ Returns a dictionary of defaults that have been overridden; this is an implementation detail of PropertyDescriptor. """
        return accumulate_dict_from_superclasses(cls, "__overridden_defaults__")

    @classmethod
    def dataspecs(cls):
        """ Returns a set of the names of this object's dataspecs (and
        dataspec subclasses).  Traverses the class hierarchy.
        """
        return set(cls.dataspecs_with_props().keys())

    @classmethod
    def dataspecs_with_props(cls):
        """ Returns a dict of dataspec names to dataspec properties. """
        return accumulate_dict_from_superclasses(cls, "__dataspecs__")

    def properties_with_values(self, include_defaults=True):
        ''' Return a dict from property names to the current values of those
        properties.

        Non-serializable properties are skipped and property values are in
        "serialized" format which may be slightly different from the values
        you would normally read from the properties; the intent of this method
        is to return the information needed to losslessly reconstitute the
        object instance.

        Args:
            include_defaults (bool, optional) :
                Whether to include properties that haven't been set. (default: True)

        Returns:
           dict : mapping from property names to their values

        '''
        result = dict()
        if include_defaults:
            keys = self.properties()
        else:
            keys = set(self._property_values.keys())
            if self.themed_values():
                keys |= set(self.themed_values().keys())

        for key in keys:
            prop = self.lookup(key)
            if not prop.serialized:
                continue

            value = prop.serializable_value(self)
            if not include_defaults:
                if isinstance(value, PropertyValueContainer) and value._unmodified_default_value:
                    continue
            result[key] = value

        return result

    def set(self, **kwargs):
        """ Sets a number of properties at once """
        for kw in kwargs:
            setattr(self, kw, kwargs[kw])

    def themed_values(self):
        """ Get any theme-provided overrides as a dict from property name
        to value, or None if no theme overrides any values for this instance.

        """
        if hasattr(self, '__themed_values__'):
            return getattr(self, '__themed_values__')
        else:
            return None

    def apply_theme(self, property_values):
        """ Apply a set of theme values which will be used rather than
        defaults, but will not override application-set values.

        The passed-in dictionary may be kept around as-is and shared with
        other instances to save memory (so neither the caller nor the
        |HasProps| instance should modify it).

        .. |HasProps| replace:: :class:`~bokeh.properties.HasProps`

        """
        old_dict = None
        if hasattr(self, '__themed_values__'):
            old_dict = getattr(self, '__themed_values__')

        # if the same theme is set again, it should reuse the
        # same dict
        if old_dict is property_values:
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

        # Emit any change notifications that result
        for k, v in old_values.items():
            prop = self.lookup(k)
            prop.trigger_if_changed(self, v)

    def unapply_theme(self):
        self.apply_theme(property_values=dict())

    def __str__(self):
        return "%s(...)" % self.__class__.__name__

    __repr__ = __str__

    def _bokeh_repr_pretty_(self, p, cycle):
        name = "%s.%s" % (self.__class__.__module__, self.__class__.__name__)

        if cycle:
            p.text("%s(...)" % name)
        else:
            with p.group(4, '%s(' % name, ')'):
                props = self.properties_with_values().items()
                sorted_props = sorted(props, key=itemgetter(0))
                all_props = sorted_props
                for i, (prop, value) in enumerate(all_props):
                    if i == 0:
                        p.breakable('')
                    else:
                        p.text(',')
                        p.breakable()
                    p.text(prop)
                    p.text('=')
                    p.pretty(value)

    def pretty(self, verbose=False, max_width=79, newline='\n'):
        """ Pretty print the object's representation. """
        if not IPython:
            cls = self.__class.__
            raise RuntimeError("%s.%s.pretty() requires IPython" % (cls.__module__, cls.__name__))
        else:
            stream = StringIO()
            printer = BokehPrettyPrinter(stream, verbose, max_width, newline)
            printer.pretty(self)
            printer.flush()
            return stream.getvalue()

    def pprint(self, verbose=False, max_width=79, newline='\n'):
        """ Like `pretty` but print to stdout. """
        if not IPython:
            cls = self.__class.__
            raise RuntimeError("%s.%s.pretty() requires IPython" % (cls.__module__, cls.__name__))
        else:
            printer = BokehPrettyPrinter(sys.stdout, verbose, max_width, newline)
            printer.pretty(self)
            printer.flush()
            sys.stdout.write(newline)
            sys.stdout.flush()

if IPython:
    from IPython.lib.pretty import RepresentationPrinter

    class BokehPrettyPrinter(RepresentationPrinter):
        def __init__(self, output, verbose=False, max_width=79, newline='\n'):
            super(BokehPrettyPrinter, self).__init__(output, verbose, max_width, newline)
            self.type_pprinters[HasProps] = lambda obj, p, cycle: obj._bokeh_repr_pretty_(p, cycle)

_PROP_LINK = ":class:`~bokeh.core.properties.%s` "
_MODEL_LINK = ":class:`~%s` "


class PrimitiveProperty(PropertyDescriptor):
    """ A base class for simple property types.

    Subclasses should define a class attribute ``_underlying_type`` that is
    a tuple of acceptable type values for the property.

    """

    _underlying_type = None

    def validate(self, value):
        super(PrimitiveProperty, self).validate(value)

        if not (value is None or isinstance(value, self._underlying_type)):
            raise ValueError("expected a value of type %s, got %s of type %s" %
                (nice_join([ cls.__name__ for cls in self._underlying_type ]), value, type(value).__name__))

    def from_json(self, json, models=None):
        if json is None or isinstance(json, self._underlying_type):
            return json
        else:
            expected = nice_join([ cls.__name__ for cls in self._underlying_type ])
            raise DeserializationError("%s expected %s, got %s" % (self, expected, json))

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__

class Bool(PrimitiveProperty):
    """ Boolean type property. """
    _underlying_type = bokeh_bool_types

class Int(PrimitiveProperty):
    """ Signed integer type property. """
    _underlying_type = bokeh_integer_types

class Float(PrimitiveProperty):
    """ Floating point type property. """
    _underlying_type = (numbers.Real,)

class Complex(PrimitiveProperty):
    """ Complex floating point type property. """
    _underlying_type = (numbers.Complex,)

class String(PrimitiveProperty):
    """ String type property. """
    _underlying_type = string_types

class Regex(String):
    """ Regex type property validates that text values match the
    given regular expression.
    """
    def __init__(self, regex, default=None, help=None):
        self.regex = re.compile(regex)
        super(Regex, self).__init__(default=default, help=help)

    def validate(self, value):
        super(Regex, self).validate(value)

        if not (value is None or self.regex.match(value) is not None):
            raise ValueError("expected a string matching %r pattern, got %r" % (self.regex.pattern, value))

    def __str__(self):
        return "%s(%r)" % (self.__class__.__name__, self.regex.pattern)

class JSON(String):
    """ JSON type property validates that text values are valid JSON.

    ..  note::
        The string is transmitted and received by BokehJS as a *string*
        containing JSON content. i.e., you must use ``JSON.parse`` to unpack
        the value into a JavaScript hash.

    """
    def validate(self, value):
        super(JSON, self).validate(value)

        if value is None: return

        try:
            import json
            json.loads(value)
        except ValueError:
            raise ValueError("expected JSON text, got %r" % value)

class ParameterizedPropertyDescriptor(PropertyDescriptor):
    """ Base class for Properties that have type parameters, e.g.
    ``List(String)``.

    """

    @staticmethod
    def _validate_type_param(type_param):
        if isinstance(type_param, type):
            if issubclass(type_param, PropertyDescriptor):
                return type_param()
            else:
                type_param = type_param.__name__
        elif isinstance(type_param, PropertyDescriptor):
            return type_param

        raise ValueError("expected a PropertyDescriptor as type parameter, got %s" % type_param)

    @property
    def type_params(self):
        raise NotImplementedError("abstract method")

    @property
    def has_ref(self):
        return any(type_param.has_ref for type_param in self.type_params)

class ContainerProperty(ParameterizedPropertyDescriptor):
    """ Base class for Container-like type properties. """

    def _has_stable_default(self):
        # all containers are mutable, so the default can be modified
        return False

class Seq(ContainerProperty):
    """ An ordered sequence of values (list, tuple, (nd)array). """

    @classmethod
    def _is_seq(cls, value):
        return ((isinstance(value, collections.Sequence) or cls._is_seq_like(value)) and
                not isinstance(value, string_types))

    @classmethod
    def _is_seq_like(cls, value):
        return (isinstance(value, (collections.Container, collections.Sized, collections.Iterable))
                and hasattr(value, "__getitem__") # NOTE: this is what makes it disallow set type
                and not isinstance(value, collections.Mapping))

    def _new_instance(self, value):
        return value

    def __init__(self, item_type, default=None, help=None):
        self.item_type = self._validate_type_param(item_type)
        super(Seq, self).__init__(default=default, help=help)

    @property
    def type_params(self):
        return [self.item_type]

    def validate(self, value):
        super(Seq, self).validate(value)

        if value is not None:
            if not (self._is_seq(value) and all(self.item_type.is_valid(item) for item in value)):
                if self._is_seq(value):
                    invalid = []
                    for item in value:
                        if not self.item_type.is_valid(item):
                            invalid.append(item)
                    raise ValueError("expected an element of %s, got seq with invalid items %r" % (self, invalid))
                else:
                    raise ValueError("expected an element of %s, got %r" % (self, value))

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, self.item_type)

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__ + "( %s )" % self.item_type._sphinx_type()

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, list):
            return self._new_instance([ self.item_type.from_json(item, models) for item in json ])
        else:
            raise DeserializationError("%s expected a list or None, got %s" % (self, json))

class List(Seq):
    """ Python list type property.

    """

    def __init__(self, item_type, default=[], help=None):
        # todo: refactor to not use mutable objects as default values.
        # Left in place for now because we want to allow None to express
        # optional values. Also in Dict.
        super(List, self).__init__(item_type, default=default, help=help)

    @classmethod
    def _is_seq(self, value):
        return isinstance(value, list)

class Array(Seq):
    """ NumPy array type property.

    """

    @classmethod
    def _is_seq(self, value):
        import numpy as np
        return isinstance(value, np.ndarray)

    def _new_instance(self, value):
        import numpy as np
        return np.array(value)


class Dict(ContainerProperty):
    """ Python dict type property.

    If a default value is passed in, then a shallow copy of it will be
    used for each new use of this property.

    """

    def __init__(self, keys_type, values_type, default={}, help=None):
        self.keys_type = self._validate_type_param(keys_type)
        self.values_type = self._validate_type_param(values_type)
        super(Dict, self).__init__(default=default, help=help)

    @property
    def type_params(self):
        return [self.keys_type, self.values_type]

    def validate(self, value):
        super(Dict, self).validate(value)

        if value is not None:
            if not (isinstance(value, dict) and \
                    all(self.keys_type.is_valid(key) and self.values_type.is_valid(val) for key, val in iteritems(value))):
                raise ValueError("expected an element of %s, got %r" % (self, value))

    def __str__(self):
        return "%s(%s, %s)" % (self.__class__.__name__, self.keys_type, self.values_type)

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__ + "( %s, %s )" % (self.keys_type._sphinx_type(), self.values_type._sphinx_type())

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, dict):
            return { self.keys_type.from_json(key, models): self.values_type.from_json(value, models) for key, value in iteritems(json) }
        else:
            raise DeserializationError("%s expected a dict or None, got %s" % (self, json))

class Tuple(ContainerProperty):
    """ Tuple type property. """
    def __init__(self, tp1, tp2, *type_params, **kwargs):
        self._type_params = list(map(self._validate_type_param, (tp1, tp2) + type_params))
        super(Tuple, self).__init__(default=kwargs.get("default"), help=kwargs.get("help"))

    @property
    def type_params(self):
        return self._type_params

    def validate(self, value):
        super(Tuple, self).validate(value)

        if value is not None:
            if not (isinstance(value, (tuple, list)) and len(self.type_params) == len(value) and \
                    all(type_param.is_valid(item) for type_param, item in zip(self.type_params, value))):
                raise ValueError("expected an element of %s, got %r" % (self, value))

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, ", ".join(map(str, self.type_params)))

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__ + "( %s )" % ", ".join(x._sphinx_type() for x in self.type_params)

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, list):
            return tuple(type_param.from_json(item, models) for type_param, item in zip(self.type_params, json))
        else:
            raise DeserializationError("%s expected a list or None, got %s" % (self, json))

class Instance(PropertyDescriptor):
    """ Instance type property, for references to other Models in the object
    graph.

    """
    def __init__(self, instance_type, default=None, help=None):
        if not isinstance(instance_type, (type,) + string_types):
            raise ValueError("expected a type or string, got %s" % instance_type)

        if isinstance(instance_type, type) and not issubclass(instance_type, HasProps):
            raise ValueError("expected a subclass of HasProps, got %s" % instance_type)

        self._instance_type = instance_type

        super(Instance, self).__init__(default=default, help=help)

    @property
    def instance_type(self):
        if isinstance(self._instance_type, str):
            module, name = self._instance_type.rsplit(".", 1)
            self._instance_type = getattr(import_module(module, "bokeh"), name)

        return self._instance_type

    def _has_stable_default(self):
        # because the instance value is mutable
        return False

    @property
    def has_ref(self):
        return True

    def validate(self, value):
        super(Instance, self).validate(value)

        if value is not None:
            if not isinstance(value, self.instance_type):
                raise ValueError("expected an instance of type %s, got %s of type %s" %
                    (self.instance_type.__name__, value, type(value).__name__))

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, self.instance_type.__name__)

    def _sphinx_type(self):
        fullname = "%s.%s" % (self.instance_type.__module__, self.instance_type.__name__)
        return _PROP_LINK % self.__class__.__name__ + "( %s )" % _MODEL_LINK % fullname

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, dict):
            from ..model import Model
            if issubclass(self.instance_type, Model):
                if models is None:
                    raise DeserializationError("%s can't deserialize without models" % self)
                else:
                    model = models.get(json["id"])

                    if model is not None:
                        return model
                    else:
                        raise DeserializationError("%s failed to deserialize reference to %s" % (self, json))
            else:
                attrs = {}

                for name, value in iteritems(json):
                    prop = self.instance_type.lookup(name).descriptor
                    attrs[name] = prop.from_json(value, models)

                # XXX: this doesn't work when Instance(Superclass) := Subclass()
                # Serialization dict must carry type information to resolve this.
                return self.instance_type(**attrs)
        else:
            raise DeserializationError("%s expected a dict or None, got %s" % (self, json))

class This(PropertyDescriptor):
    """ A reference to an instance of the class being defined. """
    pass

# Fake types, ABCs
class Any(PropertyDescriptor):
    """ Any type property accepts any values. """
    pass

class Function(PropertyDescriptor):
    """ Function type property. """
    pass

class Event(PropertyDescriptor):
    """ Event type property. """
    pass

class Interval(ParameterizedPropertyDescriptor):
    ''' Range type property ensures values are contained inside a given interval. '''
    def __init__(self, interval_type, start, end, default=None, help=None):
        self.interval_type = self._validate_type_param(interval_type)
        # Make up a property name for validation purposes
        self.interval_type.validate(start)
        self.interval_type.validate(end)
        self.start = start
        self.end = end
        super(Interval, self).__init__(default=default, help=help)

    @property
    def type_params(self):
        return [self.interval_type]

    def validate(self, value):
        super(Interval, self).validate(value)

        if not (value is None or self.interval_type.is_valid(value) and value >= self.start and value <= self.end):
            raise ValueError("expected a value of type %s in range [%s, %s], got %r" % (self.interval_type, self.start, self.end, value))

    def __str__(self):
        return "%s(%s, %r, %r)" % (self.__class__.__name__, self.interval_type, self.start, self.end)

class Byte(Interval):
    ''' Byte type property. '''
    def __init__(self, default=0, help=None):
        super(Byte, self).__init__(Int, 0, 255, default=default, help=help)

class Either(ParameterizedPropertyDescriptor):
    """ Takes a list of valid properties and validates against them in succession. """

    def __init__(self, tp1, tp2, *type_params, **kwargs):
        self._type_params = list(map(self._validate_type_param, (tp1, tp2) + type_params))
        help = kwargs.get("help")
        def choose_default():
            return self._type_params[0]._raw_default()
        default = kwargs.get("default", choose_default)
        super(Either, self).__init__(default=default, help=help)

    @property
    def type_params(self):
        return self._type_params

    def validate(self, value):
        super(Either, self).validate(value)

        if not (value is None or any(param.is_valid(value) for param in self.type_params)):
            raise ValueError("expected an element of either %s, got %r" % (nice_join(self.type_params), value))

    def transform(self, value):
        for param in self.type_params:
            try:
                return param.transform(value)
            except ValueError:
                pass

        raise ValueError("Could not transform %r" % value)

    def from_json(self, json, models=None):
        for tp in self.type_params:
            try:
                return tp.from_json(json, models)
            except DeserializationError:
                pass
        else:
            raise DeserializationError("%s couldn't deserialize %s" % (self, json))

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, ", ".join(map(str, self.type_params)))

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__ + "( %s )" % ", ".join(x._sphinx_type() for x in self.type_params)

    def __or__(self, other):
        return self.__class__(*(self.type_params + [other]), default=self._default, help=self.help)

class Enum(String):
    """ An Enum with a list of allowed values. The first value in the list is
    the default value, unless a default is provided with the "default" keyword
    argument.
    """
    def __init__(self, enum, *values, **kwargs):
        if not (not values and isinstance(enum, enums.Enumeration)):
            enum = enums.enumeration(enum, *values)

        self._enum = enum

        default = kwargs.get("default", enum._default)
        help = kwargs.get("help")

        super(Enum, self).__init__(default=default, help=help)

    @property
    def allowed_values(self):
        return self._enum._values

    def validate(self, value):
        super(Enum, self).validate(value)

        if not (value is None or value in self._enum):
            raise ValueError("invalid value: %r; allowed values are %s" % (value, nice_join(self.allowed_values)))

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, ", ".join(map(repr, self.allowed_values)))

    def _sphinx_type(self):
        # try to return a link to a proper enum in bokeh.core.enums if possible
        if self._enum in enums.__dict__.values():
            for name, obj in enums.__dict__.items():
                if self._enum is obj:
                    val = _MODEL_LINK % "%s.%s" % (self._enum.__module__, name)
        else:
            val = str(self._enum)
        return _PROP_LINK % self.__class__.__name__ + "( %s )" % val

class Auto(Enum):
    """ Accepts the string "auto".

    Useful for properties that can be configured to behave "automatically".

    """
    def __init__(self):
        super(Auto, self).__init__("auto")

    def __str__(self):
        return self.__class__.__name__

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__

# Properties useful for defining visual attributes
class Color(Either):
    """ Accepts color definition in a variety of ways, and produces an
    appropriate serialization of its value for whatever backend.

    For colors, because we support named colors and hex values prefaced
    with a "#", when we are handed a string value, there is a little
    interpretation: if the value is one of the 147 SVG named colors or
    it starts with a "#", then it is interpreted as a value.

    If a 3-tuple is provided, then it is treated as an RGB (0..255).
    If a 4-tuple is provided, then it is treated as an RGBa (0..255), with
    alpha as a float between 0 and 1.  (This follows the HTML5 Canvas API.)
    """

    def __init__(self, default=None, help=None):
        types = (Enum(enums.NamedColor),
                 Regex("^#[0-9a-fA-F]{6}$"),
                 Tuple(Byte, Byte, Byte),
                 Tuple(Byte, Byte, Byte, Percent))
        super(Color, self).__init__(*types, default=default, help=help)

    def transform(self, value):
        if isinstance(value, tuple):
            value = RGB(*value).to_css()
        return value

    def __str__(self):
        return self.__class__.__name__

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__


class MinMaxBounds(Either):
    """ Accepts min and max bounds for use with Ranges.

    Bounds are provided as a tuple of ``(min, max)`` so regardless of whether your range is
    increasing or decreasing, the first item should be the minimum value of the range and the
    second item should be the maximum. Setting min > max will result in a ``ValueError``.

    Setting bounds to None will allow your plot to pan/zoom as far as you want. If you only
    want to constrain one end of the plot, you can set min or max to
    ``None`` e.g. ``DataRange1d(bounds=(None, 12))`` """

    def __init__(self, accept_datetime=False, default='auto', help=None):
        if accept_datetime:
            types = (
                Auto,
                Tuple(Float, Float),
                Tuple(Datetime, Datetime),
            )
        else:
            types = (
                Auto,
                Tuple(Float, Float),
            )
        super(MinMaxBounds, self).__init__(*types, default=default, help=help)

    def validate(self, value):
        super(MinMaxBounds, self).validate(value)

        if value is None:
            pass

        elif value[0] is None or value[1] is None:
            pass

        elif value[0] >= value[1]:
            raise ValueError('Invalid bounds: maximum smaller than minimum. Correct usage: bounds=(min, max)')

        return True

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__


class Align(PropertyDescriptor):
    pass


class DashPattern(Either):
    """ Dash type property.

    Express patterns that describe line dashes.  ``DashPattern`` values
    can be specified in a variety of ways:

    * An enum: "solid", "dashed", "dotted", "dotdash", "dashdot"
    * a tuple or list of integers in the `HTML5 Canvas dash specification style`_.
      Note that if the list of integers has an odd number of elements, then
      it is duplicated, and that duplicated list becomes the new dash list.

    To indicate that dashing is turned off (solid lines), specify the empty
    list [].

    .. _HTML5 Canvas dash specification style: http://www.w3.org/html/wg/drafts/2dcontext/html5_canvas/#dash-list

    """

    _dash_patterns = {
        "solid": [],
        "dashed": [6],
        "dotted": [2,4],
        "dotdash": [2,4,6,4],
        "dashdot": [6,4,2,4],
    }

    def __init__(self, default=[], help=None):
        types = Enum(enums.DashPattern), Regex(r"^(\d+(\s+\d+)*)?$"), Seq(Int)
        super(DashPattern, self).__init__(*types, default=default, help=help)

    def transform(self, value):
        value = super(DashPattern, self).transform(value)

        if isinstance(value, string_types):
            try:
                return self._dash_patterns[value]
            except KeyError:
                return [int(x) for x in  value.split()]
        else:
            return value

    def __str__(self):
        return self.__class__.__name__

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__

class Size(Float):
    """ Size type property.

    .. note::
        ``Size`` is equivalent to an unsigned int.

    """
    def validate(self, value):
        super(Size, self).validate(value)

        if not (value is None or 0.0 <= value):
            raise ValueError("expected a non-negative number, got %r" % value)

class Percent(Float):
    """ Percentage type property.

    Percents are useful for specifying alphas and coverage and extents; more
    semantically meaningful than Float(0..1).

    """
    def validate(self, value):
        super(Percent, self).validate(value)

        if not (value is None or 0.0 <= value <= 1.0):
            raise ValueError("expected a value in range [0, 1], got %r" % value)

class Angle(Float):
    """ Angle type property. """
    pass

class Date(PropertyDescriptor):
    """ Date (not datetime) type property.

    """
    def __init__(self, default=datetime.date.today(), help=None):
        super(Date, self).__init__(default=default, help=help)

    def validate(self, value):
        super(Date, self).validate(value)

        if not (value is None or isinstance(value, (datetime.date,) + string_types + (float,) + bokeh_integer_types)):
            raise ValueError("expected a date, string or timestamp, got %r" % value)

    def transform(self, value):
        value = super(Date, self).transform(value)

        if isinstance(value, (float,) + bokeh_integer_types):
            try:
                value = datetime.date.fromtimestamp(value)
            except ValueError:
                value = datetime.date.fromtimestamp(value/1000)
        elif isinstance(value, string_types):
            value = dateutil.parser.parse(value).date()

        return value

class Datetime(PropertyDescriptor):
    """ Datetime type property.

    """

    def __init__(self, default=datetime.date.today(), help=None):
        super(Datetime, self).__init__(default=default, help=help)

    def validate(self, value):
        super(Datetime, self).validate(value)

        datetime_types = (datetime.datetime, datetime.date)
        try:
            import numpy as np
            datetime_types += (np.datetime64,)
        except (ImportError, AttributeError) as e:
            if e.args == ("'module' object has no attribute 'datetime64'",):
                import sys
                if 'PyPy' in sys.version:
                    pass
                else:
                    raise e
            else:
                pass

        if (isinstance(value, datetime_types)):
            return

        if pd and isinstance(value, (pd.Timestamp)):
            return

        raise ValueError("Expected a datetime instance, got %r" % value)

    def transform(self, value):
        value = super(Datetime, self).transform(value)
        return value
        # Handled by serialization in protocol.py for now

class TimeDelta(PropertyDescriptor):
    """ TimeDelta type property.

    """

    def __init__(self, default=datetime.timedelta(), help=None):
        super(TimeDelta, self).__init__(default=default, help=help)

    def validate(self, value):
        super(TimeDelta, self).validate(value)

        timedelta_types = (datetime.timedelta,)
        try:
            import numpy as np
            timedelta_types += (np.timedelta64,)
        except (ImportError, AttributeError) as e:
            if e.args == ("'module' object has no attribute 'timedelta64'",):
                import sys
                if 'PyPy' in sys.version:
                    pass
                else:
                    raise e
            else:
                pass

        if (isinstance(value, timedelta_types)):
            return

        if pd and isinstance(value, (pd.Timedelta)):
            return

        raise ValueError("Expected a timedelta instance, got %r" % value)

    def transform(self, value):
        value = super(TimeDelta, self).transform(value)
        return value
        # Handled by serialization in protocol.py for now

class RelativeDelta(Dict):
    """ RelativeDelta type property for time deltas.

    """

    def __init__(self, default={}, help=None):
        keys = Enum("years", "months", "days", "hours", "minutes", "seconds", "microseconds")
        values = Int
        super(RelativeDelta, self).__init__(keys, values, default=default, help=help)

    def __str__(self):
        return self.__class__.__name__

class DataSpecProperty(BasicProperty):
    """ A Property with a DataSpec descriptor."""

    def serializable_value(self, obj):
        return self.descriptor.to_serializable(obj, self.name, getattr(obj, self.name))

    def set_from_json(self, obj, json, models=None):
        if isinstance(json, dict):
            # we want to try to keep the "format" of the data spec as string, dict, or number,
            # assuming the serialized dict is compatible with that.
            old = getattr(obj, self.name)
            if old is not None:
                try:
                    self.descriptor._type.validate(old)
                    if 'value' in json:
                        json = json['value']
                except ValueError:
                    if isinstance(old, string_types) and 'field' in json:
                        json = json['field']
                # leave it as a dict if 'old' was a dict

        super(DataSpecProperty, self).set_from_json(obj, json, models)

class DataSpec(Either):
    ''' Represent either a fixed value, or a reference to a column in a data source.

    '''
    def __init__(self, typ, default, help=None):
        super(DataSpec, self).__init__(
            String,
            Dict(
                String,
                Either(
                    String,
                    Instance('bokeh.models.transforms.Transform'),
                    Instance('bokeh.models.mappers.ColorMapper'),
                    typ)),
            typ,
            default=default,
            help=help
        )
        self._type = self._validate_type_param(typ)

    # TODO (bev) add stricter validation on keys

    def make_properties(self, base_name):
        return [ DataSpecProperty(descriptor=self, name=base_name) ]

    def to_serializable(self, obj, name, val):
        # Check for None value; this means "the whole thing is
        # unset," not "the value is None."
        if val is None:
            return None

        # Check for spec type value
        try:
            self._type.validate(val)
            return dict(value=val)
        except ValueError:
            pass

        # Check for data source field name
        if isinstance(val, string_types):
            return dict(field=val)

        # Must be dict, return as-is
        return val

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__

class NumberSpec(DataSpec):
    ''' A DataSpec property that can be set to a numeric fixed value,
    or a data source column name referring to column of numeric data.

    '''
    def __init__(self, default=None, help=None):
        super(NumberSpec, self).__init__(Float, default=default, help=help)

class StringSpec(DataSpec):
    ''' A DataSpec property that can be set to a string fixed value,
    or a data source column name referring to column of string data.

    .. note::
        Because acceptable fixed values and field names are both strings,
        it is often necessary to use the |field| and |value| functions
        explicitly to disambiguate.

    .. |field| replace:: :func:`~bokeh.core.properties.field`
    .. |value| replace:: :func:`~bokeh.core.properties.value`

    '''
    def __init__(self, default, help=None):
        super(StringSpec, self).__init__(List(String), default=default, help=help)

    def prepare_value(self, cls, name, value):
        if isinstance(value, list):
            if len(value) != 1:
                raise TypeError("StringSpec convenience list values must have length 1")
            value = dict(value=value[0])
        return super(StringSpec, self).prepare_value(cls, name, value)

class FontSizeSpec(DataSpec):
    ''' A DataSpec property that can be set to a font size fixed value,
    or a data source column name referring to column of font size data.

    ``FontSizeSpec`` tries to determine if the a string value is a valid
    CSS unit of length, e.g ``"10pt"`` or ``"1.5em"``. If the string can be
    interpreted as a CSS length, then the DataSpec is a value spec.
    Otherwise, setting a string value will result in a field spec.

    A full list of all valid CSS length units can be found here:

    https://drafts.csswg.org/css-values/#lengths

    '''
    _font_size_re = re.compile("^[0-9]+(\.[0-9]+)?(%|em|ex|ch|ic|rem|vw|vh|vi|vb|vmin|vmax|cm|mm|q|in|pc|pt|px)$", re.I)

    def __init__(self, default, help=None):
        super(FontSizeSpec, self).__init__(List(String), default=default, help=help)

    def prepare_value(self, cls, name, value):
        if isinstance(value, string_types) and self._font_size_re.match(value) is not None:
            value = dict(value=value)
        return super(FontSizeSpec, self).prepare_value(cls, name, value)

class UnitsSpecProperty(DataSpecProperty):
    ''' A Property that sets a matching `_units` property as a side effect. '''

    def __init__(self, descriptor, name, units_prop):
        super(UnitsSpecProperty, self).__init__(descriptor, name)
        self.units_prop = units_prop

    def _extract_units(self, obj, value):
        if isinstance(value, dict):
            if 'units' in value:
                value = copy(value) # so we can modify it
            units = value.pop("units", None)
            if units:
                self.units_prop.__set__(obj, units)
        return value

    def __set__(self, obj, value):
        value = self._extract_units(obj, value)
        super(UnitsSpecProperty, self).__set__(obj, value)

    def set_from_json(self, obj, json, models=None):
        json = self._extract_units(obj, json)
        super(UnitsSpecProperty, self).set_from_json(obj, json, models)

class UnitsSpec(NumberSpec):
    ''' A numeric DataSpec property with units.

    '''
    def __init__(self, default, units_type, units_default, help=None):
        super(UnitsSpec, self).__init__(default=default, help=help)
        self._units_type = self._validate_type_param(units_type)
        # this is a hack because we already constructed units_type
        self._units_type.validate(units_default)
        self._units_type._default = units_default
        # this is sort of a hack because we don't have a
        # serialized= kwarg on every PropertyDescriptor subtype
        self._units_type._serialized = False

    def make_properties(self, base_name):
        units_name = base_name + "_units"
        units_props = self._units_type.make_properties(units_name)
        return units_props + [ UnitsSpecProperty(descriptor=self, name=base_name, units_prop=units_props[0]) ]

    def to_serializable(self, obj, name, val):
        d = super(UnitsSpec, self).to_serializable(obj, name, val)
        if d is not None and 'units' not in d:
            d["units"] = getattr(obj, name+"_units")
        return d

    def __str__(self):
        return "%s(units_default=%r)" % (self.__class__.__name__, self._units_type._default)

class AngleSpec(UnitsSpec):
    ''' A numeric DataSpec property to represent angles.

    Acceptable values for units are ``"rad"`` and ``"deg"``.

    '''
    def __init__(self, default=None, units_default="rad", help=None):
        super(AngleSpec, self).__init__(default=default, units_type=Enum(enums.AngleUnits), units_default=units_default, help=help)

class DistanceSpec(UnitsSpec):
    ''' A numeric DataSpec property to represent screen or data space distances.

    Acceptable values for units are ``"screen"`` and ``"data"``.

    '''
    def __init__(self, default=None, units_default="data", help=None):
        super(DistanceSpec, self).__init__(default=default, units_type=Enum(enums.SpatialUnits), units_default=units_default, help=help)

    def prepare_value(self, cls, name, value):
        try:
            if value is not None and value < 0:
                raise ValueError("Distances must be positive or None!")
        except TypeError:
            pass
        return super(DistanceSpec, self).prepare_value(cls, name, value)

class ScreenDistanceSpec(NumberSpec):
    ''' A numeric DataSpec property to represent screen distances.

    .. note::
        Units are always ``"screen"``.

    '''
    def to_serializable(self, obj, name, val):
        d = super(ScreenDistanceSpec, self).to_serializable(obj, name, val)
        d["units"] = "screen"
        return d

    def prepare_value(self, cls, name, value):
        try:
            if value is not None and value < 0:
                raise ValueError("Distances must be positive or None!")
        except TypeError:
            pass
        return super(ScreenDistanceSpec, self).prepare_value(cls, name, value)

class DataDistanceSpec(NumberSpec):
    ''' A numeric DataSpec property to represent data space distances.

    .. note::
        Units are always ``"data"``.

    '''
    def to_serializable(self, obj, name, val):
        d = super(ScreenDistanceSpec, self).to_serializable(obj, name, val)
        d["units"] = "data"
        return d

    def prepare_value(self, cls, name, value):
        try:
            if value is not None and value < 0:
                raise ValueError("Distances must be positive or None!")
        except TypeError:
            pass
        return super(DataDistanceSpec, self).prepare_value(cls, name, value)

class ColorSpec(DataSpec):
    ''' A DataSpec property that can be set to a Color fixed value,
    or a data source column name referring to column of color data.

    '''
    def __init__(self, default, help=None):
        super(ColorSpec, self).__init__(Color, default=default, help=help)

    @classmethod
    def isconst(cls, arg):
        """ Returns True if the argument is a literal color.  Check for a
        well-formed hexadecimal color value.
        """
        return isinstance(arg, string_types) and \
               ((len(arg) == 7 and arg[0] == "#") or arg in enums.NamedColor)

    @classmethod
    def is_color_tuple(cls, val):
        return isinstance(val, tuple) and len(val) in (3, 4)

    @classmethod
    def format_tuple(cls, colortuple):
        if len(colortuple) == 3:
            return "rgb%r" % (colortuple,)
        else:
            return "rgba%r" % (colortuple,)

    def to_serializable(self, obj, name, val):
        if val is None:
            return dict(value=None)

        # Check for hexadecimal or named color
        if self.isconst(val):
            return dict(value=val)

        # Check for RGB or RGBa tuple
        if isinstance(val, tuple):
            return dict(value=self.format_tuple(val))

        # Check for data source field name
        if isinstance(val, string_types):
            return dict(field=val)

        # Must be dict, return as-is
        return val

    def validate(self, value):
        try:
            return super(ColorSpec, self).validate(value)
        except ValueError as e:
            # Check for tuple input if not yet a valid input type
            if self.is_color_tuple(value):
                return True
            else:
                raise e

    def transform(self, value):

        # Make sure that any tuple has either three integers, or three integers and one float
        if isinstance(value, tuple):
            value = tuple(int(v) if i < 3 else v for i, v in enumerate(value))

        return value

class TitleProp(Either):
    ''' Accepts a title for a plot

    '''
    def __init__(self, default=None, help=None):
        types = (Instance('bokeh.models.annotations.Title'), String)
        super(TitleProp, self).__init__(*types, default=default, help=help)

    def _sphinx_type(self):
        return _PROP_LINK % self.__class__.__name__

    def transform(self, value):
        if isinstance(value, str):
            from bokeh.models.annotations import Title
            deprecated("""Setting Plot property 'title' using a string was deprecated in 0.12.0,
            and will be removed. The title is now an object on Plot (which holds all of it's
            styling properties). Please use Plot.title.text instead.

            SERVER USERS: If you were using plot.title to have the server update the plot title
            in a callback, you MUST update to plot.title.text as the title object cannot currently
            be replaced after intialization.
            """)
            value = Title(text=value)
        return value
