""" Properties are objects that can be assigned as class level
attributes on Bokeh models, to provide automatic serialization
and validation.

For example, the following defines a model that has integer,
string, and list[float] properties::

    class Model(HasProps):
        foo = Int
        bar = String
        baz = List(Float)

The properties of this class can be initialized by specifying
keyword arguments to the initializer::

    m = Model(foo=10, bar="a str", baz=[1,2,3,4])

But also by setting the attributes on an instance::

    m.foo = 20

Attempts to set a property to a value of the wrong type will
result in a ``ValueError`` exception::

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

Additionally, properties know how to serialize themselves,
to be understood by BokehJS.

"""
from __future__ import absolute_import, print_function

import re
import types
import difflib
import datetime
import dateutil.parser
import collections
from importlib import import_module
from copy import copy
from warnings import warn
import inspect
import logging
logger = logging.getLogger(__name__)

from six import integer_types, string_types, add_metaclass, iteritems
import numpy as np

from . import enums
from .util.string import nice_join

def field(name):
    ''' Convenience function do explicitly mark a field specification for
    a Bokeh model property.

    Args:
        name (str) : name of a data source field to reference for a property.

    Returns:
        dict : `{"field": name}`

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
        dict : `{"value": name}`

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

bokeh_integer_types = (np.int8, np.int16, np.int32, np.int64) + integer_types

# used to indicate properties that are not set (vs null, None, etc)
class _NotSet(object):
    pass

class DeserializationError(Exception):
    pass

class Property(object):
    """ Base class for all type properties. """

    def __init__(self, default=None, help=None):
        """ This is how the descriptor is created in the class declaration """
        if isinstance(default, types.FunctionType): # aka. lazy value
            self.validate(default())
        else:
            self.validate(default)

        self._default = default
        self.__doc__ = help
        self.alternatives = []

        # This gets set by the class decorator at class creation time
        self.name = "unnamed"

    def __str__(self):
        return self.__class__.__name__

    @property
    def _name(self):
        return "_" + self.name

    @property
    def default(self):
        if not isinstance(self._default, types.FunctionType):
            return copy(self._default)
        else:
            value = self._default()
            self.validate(value)
            return value

    @classmethod
    def autocreate(cls, name=None):
        """ Called by the metaclass to create a
        new instance of this descriptor
        if the user just assigned it to a property without trailing
        parentheses.
        """
        return cls()

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
        except Exception as e:
            logger.debug("could not compare %s and %s for property %s (Reason: %s)", new, old, self.name, e)
        return False

    def from_json(self, json, models=None):
        return json

    def transform(self, value):
        return value

    def validate(self, value):
        pass

    def is_valid(self, value):
        try:
            self.validate(value)
        except ValueError:
            return False
        else:
            return True

    def _get(self, obj):
        if not hasattr(obj, self._name):
            setattr(obj, self._name, self.default)
        return getattr(obj, self._name)

    def __get__(self, obj, owner=None):
        if obj is not None:
            return self._get(obj)
        elif owner is not None:
            return self
        else:
            raise ValueError("both 'obj' and 'owner' are None, don't know what to do")

    def __set__(self, obj, value):
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

        old = self.__get__(obj)
        obj._changed_vars.add(self.name)
        if self._name in obj.__dict__ and self.matches(value, old):
            return
        setattr(obj, self._name, value)
        obj._dirty = True
        if hasattr(obj, '_trigger'):
            if hasattr(obj, '_block_callbacks') and obj._block_callbacks:
                obj._callback_queue.append((self.name, old, value))
            else:
                obj._trigger(self.name, old, value)

    def __delete__(self, obj):
        if hasattr(obj, self._name):
            delattr(obj, self._name)

    @property
    def has_ref(self):
        return False

    def accepts(self, tp, converter):
        tp = ParameterizedProperty._validate_type_param(tp)
        self.alternatives.append((tp, converter))
        return self

    def __or__(self, other):
        return Either(self, other)

class Include(object):
    """ Include other properties from mixin Models, with a given prefix. """

    def __init__(self, delegate, help="", use_prefix=True):
        if not (isinstance(delegate, type) and issubclass(delegate, HasProps)):
            raise ValueError("expected a subclass of HasProps, got %r" % delegate)

        self.delegate = delegate
        self.help = help
        self.use_prefix = use_prefix

class MetaHasProps(type):
    def __new__(cls, class_name, bases, class_dict):
        names = set()
        names_with_refs = set()
        container_names = set()

        # First pre-process to handle all the Includes
        includes = {}
        removes = set()
        for name, prop in class_dict.items():
            if not isinstance(prop, Include):
                continue

            delegate = prop.delegate
            if prop.use_prefix:
                prefix = re.sub("_props$", "", name) + "_"
            else:
                prefix = ""

            for subpropname in delegate.class_properties(withbases=False):
                fullpropname = prefix + subpropname
                subprop = delegate.lookup(subpropname)
                if isinstance(subprop, Property):
                    # If it's an actual instance, then we need to make a copy
                    # so two properties don't write to the same hidden variable
                    # inside the instance.
                    subprop = copy(subprop)
                if "%s" in prop.help:
                    doc = prop.help % subpropname.replace('_', ' ')
                else:
                    doc = prop.help
                try:
                    includes[fullpropname] = subprop(help=doc)
                except TypeError:
                    includes[fullpropname] = subprop
                    subprop.__doc__ = doc
            # Remove the name of the Include attribute itself
            removes.add(name)

        # Update the class dictionary, taking care not to overwrite values
        # from the delegates that the subclass may have explicitly defined
        for key, val in includes.items():
            if key not in class_dict:
                class_dict[key] = val
        for tmp in removes:
            del class_dict[tmp]

        dataspecs = {}
        units_to_add = {}
        for name, prop in class_dict.items():
            if isinstance(prop, Property):
                prop.name = name
                if prop.has_ref:
                    names_with_refs.add(name)
                elif isinstance(prop, ContainerProperty):
                    container_names.add(name)
                names.add(name)
                if isinstance(prop, DataSpec):
                    dataspecs[name] = prop
                    if hasattr(prop, '_units_type'):
                        units_to_add[name+"_units"] = prop._units_type

            elif isinstance(prop, type) and issubclass(prop, Property):
                # Support the user adding a property without using parens,
                # i.e. using just the Property subclass instead of an
                # instance of the subclass
                newprop = prop.autocreate(name=name)
                class_dict[name] = newprop
                newprop.name = name
                names.add(name)

                # Process dataspecs
                if issubclass(prop, DataSpec):
                    dataspecs[name] = newprop

        for name, prop in units_to_add.items():
            prop.name = name
            names.add(name)
            class_dict[name] = prop

        class_dict["__properties__"] = names
        class_dict["__properties_with_refs__"] = names_with_refs
        class_dict["__container_props__"] = container_names
        if dataspecs:
            class_dict["_dataspecs"] = dataspecs
        return type.__new__(cls, class_name, bases, class_dict)

def accumulate_from_subclasses(cls, propname):
    s = set()
    for c in inspect.getmro(cls):
        if issubclass(c, HasProps):
            s.update(getattr(c, propname))
    return s

def abstract(cls):
    """ A phony decorator to mark abstract base classes. """
    if not issubclass(cls, HasProps):
        raise TypeError("%s is not a subclass of HasProps" % cls.__name__)

    return cls

@add_metaclass(MetaHasProps)
class HasProps(object):

    def __init__(self, **properties):
        super(HasProps, self).__init__()
        self._changed_vars = set()

        for name, value in properties.items():
            setattr(self, name, value)

    def __setattr__(self, name, value):
        props = sorted(self.properties())

        if name.startswith("_") or name in props:
            super(HasProps, self).__setattr__(name, value)
        else:
            matches, text = difflib.get_close_matches(name.lower(), props), "similar"

            if not matches:
                matches, text = props, "possible"

            raise AttributeError("unexpected attribute '%s' to %s, %s attributes are %s" %
                (name, self.__class__.__name__, text, nice_join(matches)))

    def clone(self):
        """ Returns a duplicate of this object with all its properties
        set appropriately.  Values which are containers are shallow-copied.
        """
        return self.__class__(**self.changed_properties_with_values())

    @classmethod
    def lookup(cls, name):
        return getattr(cls, name)

    @classmethod
    def properties_with_refs(cls):
        """ Returns a set of the names of this object's properties that
        have references. We traverse the class hierarchy and
        pull together the full list of properties.
        """
        if not hasattr(cls, "__cached_allprops_with_refs"):
            s = accumulate_from_subclasses(cls, "__properties_with_refs__")
            cls.__cached_allprops_with_refs = s
        return cls.__cached_allprops_with_refs

    @classmethod
    def properties_containers(cls):
        """ Returns a list of properties that are containers
        """
        if not hasattr(cls, "__cached_allprops_containers"):
            s = accumulate_from_subclasses(cls, "__container_props__")
            cls.__cached_allprops_containers = s
        return cls.__cached_allprops_containers

    @classmethod
    def properties(cls):
        """ Returns a set of the names of this object's properties. We
        traverse the class hierarchy and pull together the full
        list of properties.
        """
        if not hasattr(cls, "__cached_allprops"):
            s = cls.class_properties()
            cls.__cached_allprops = s
        return cls.__cached_allprops

    @classmethod
    def dataspecs(cls):
        """ Returns a set of the names of this object's dataspecs (and
        dataspec subclasses).  Traverses the class hierarchy.
        """
        if not hasattr(cls, "__cached_dataspecs"):
            dataspecs = set()
            for c in reversed(inspect.getmro(cls)):
                if hasattr(c, "_dataspecs"):
                    dataspecs.update(c._dataspecs.keys())
            cls.__cached_dataspecs = dataspecs
        return cls.__cached_dataspecs

    @classmethod
    def dataspecs_with_refs(cls):
        dataspecs = {}
        for c in reversed(inspect.getmro(cls)):
            if hasattr(c, "_dataspecs"):
                dataspecs.update(c._dataspecs)
        return dataspecs

    def changed_vars(self):
        """ Returns which variables changed since the creation of the object,
        or the last called to reset_changed_vars().
        """
        return set.union(self._changed_vars, self.properties_with_refs(),
                         self.properties_containers())

    def reset_changed_vars(self):
        self._changed_vars = set()

    def properties_with_values(self):
        return dict([ (attr, getattr(self, attr)) for attr in self.properties() ])

    def changed_properties(self):
        return self.changed_vars()

    def changed_properties_with_values(self):
        return dict([ (attr, getattr(self, attr)) for attr in self.changed_properties() ])

    @classmethod
    def class_properties(cls, withbases=True):
        if withbases:
            return accumulate_from_subclasses(cls, "__properties__")
        else:
            return set(cls.__properties__)

    def set(self, **kwargs):
        """ Sets a number of properties at once """
        for kw in kwargs:
            setattr(self, kw, kwargs[kw])

    def pprint_props(self, indent=0):
        """ Prints the properties of this object, nicely formatted """
        for key, value in self.properties_with_values().items():
            print("%s%s: %r" % ("  "*indent, key, value))

class PrimitiveProperty(Property):
    """ A base class for simple property types. Subclasses should
    define a class attribute ``_underlying_type`` that is a tuple
    of acceptable type values for the property.

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

class Bool(PrimitiveProperty):
    """ Boolean type property. """
    _underlying_type = (bool, np.bool_)

class Int(PrimitiveProperty):
    """ Signed integer type property. """
    _underlying_type = bokeh_integer_types

class Float(PrimitiveProperty):
    """ Floating point type property. """
    _underlying_type = (float, ) + bokeh_integer_types

class Complex(PrimitiveProperty):
    """ Complex floating point type property. """
    _underlying_type = (complex, float) + bokeh_integer_types

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

class ParameterizedProperty(Property):
    """ Base class for Properties that have type parameters, e.g.
    ``List(String)``.

    """

    @staticmethod
    def _validate_type_param(type_param):
        if isinstance(type_param, type):
            if issubclass(type_param, Property):
                return type_param()
            else:
                type_param = type_param.__name__
        elif isinstance(type_param, Property):
            return type_param

        raise ValueError("expected a property as type parameter, got %s" % type_param)

    @property
    def type_params(self):
        raise NotImplementedError("abstract method")

    @property
    def has_ref(self):
        return any(type_param.has_ref for type_param in self.type_params)

class ContainerProperty(ParameterizedProperty):
    """ Base class for Container-like type properties. """
    pass

class Seq(ContainerProperty):
    """ Sequence (list, tuple) type property.

    """

    def _is_seq(self, value):
        return isinstance(value, collections.Container) and not isinstance(value, collections.Mapping)

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
                raise ValueError("expected an element of %s, got %r" % (self, value))

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, self.item_type)

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
        # opional values. Also in Dict.
        super(List, self).__init__(item_type, default=default, help=help)

    def _is_seq(self, value):
        return isinstance(value, list)

class Array(Seq):
    """ NumPy array type property.

    """

    def _is_seq(self, value):
        import numpy as np
        return isinstance(value, np.ndarray)

    def _new_instance(self, value):
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

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, list):
            return tuple(type_param.from_json(item, models) for type_param, item in zip(self.type_params, json))
        else:
            raise DeserializationError("%s expected a list or None, got %s" % (self, json))

class Instance(Property):
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

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, dict):
            from .plot_object import PlotObject
            if issubclass(self.instance_type, PlotObject):
                if models is None:
                    raise DeserializationError("%s can't deserialize without models" % self)
                else:
                    model = models.get(json["id"])

                    if model is not None:
                        return model
                    else:
                        raise DeserializationError("%s failed to deserilize reference to %s" % (self, json))
            else:
                attrs = {}

                for name, value in iteritems(json):
                    prop = self.instance_type.lookup(name)
                    attrs[name] = prop.from_json(value, models)

                # XXX: this doesn't work when Instance(Superclass) := Subclass()
                # Serialization dict must carry type information to resolve this.
                return self.instance_type(**attrs)
        else:
            raise DeserializationError("%s expected a dict or None, got %s" % (self, json))

class This(Property):
    """ A reference to an instance of the class being defined. """
    pass

# Fake types, ABCs
class Any(Property):
    """ Any type property accepts any values. """
    pass

class Function(Property):
    """ Function type property. """
    pass

class Event(Property):
    """ Event type property. """
    pass

class Interval(ParameterizedProperty):
    ''' Range type property ensures values are contained inside a given interval. '''
    def __init__(self, interval_type, start, end, default=None, help=None):
        self.interval_type = self._validate_type_param(interval_type)
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

class Either(ParameterizedProperty):
    """ Takes a list of valid properties and validates against them in succession. """

    def __init__(self, tp1, tp2, *type_params, **kwargs):
        self._type_params = list(map(self._validate_type_param, (tp1, tp2) + type_params))
        default = kwargs.get("default", self._type_params[0].default)
        help = kwargs.get("help")
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
            raise ValueError("invalid value for %s: %r; allowed values are %s" % (self.name, value, nice_join(self.allowed_values)))

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, ", ".join(map(repr, self.allowed_values)))

class Auto(Enum):

    def __init__(self):
        super(Auto, self).__init__("auto")

    def __str__(self):
        return self.__class__.__name__

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

    def __str__(self):
        return self.__class__.__name__


class Align(Property):
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

class Date(Property):
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

class Datetime(Property):
    """ Datetime type property.

    """

    def __init__(self, default=datetime.date.today(), help=None):
        super(Datetime, self).__init__(default=default, help=help)

    def validate(self, value):
        super(Datetime, self).validate(value)

        if (isinstance(value, (datetime.datetime, datetime.date, np.datetime64))):
            return
        try:
            import pandas
            if isinstance(value, (pandas.Timestamp)):
                return
        except ImportError:
            pass

        raise ValueError("Expected a datetime instance, got %r" % value)

    def transform(self, value):
        value = super(Datetime, self).transform(value)
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

class DataSpec(Either):
    def __init__(self, typ, default, help=None):
        super(DataSpec, self).__init__(String, Dict(String, Either(String, typ)), typ, default=default, help=help)
        self._type = self._validate_type_param(typ)

    def to_dict(self, obj):
        val = getattr(obj, self._name, self.default)

        # Check for None value
        if val is None:
            return dict(value=None)

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

    def __str__(self):
        val = getattr(self, self._name, self.default)
        return "%s(%r)" % (self.__class__.__name__, val)

class NumberSpec(DataSpec):
    def __init__(self, default, help=None):
        super(NumberSpec, self).__init__(Float, default=default, help=help)

class StringSpec(DataSpec):
    def __init__(self, default, help=None):
        super(StringSpec, self).__init__(List(String), default=default, help=help)

    def __set__(self, obj, value):
        if isinstance(value, list):
            if len(value) != 1:
                raise TypeError("StringSpec convenience list values must have length 1")
            value = dict(value=value[0])
        super(StringSpec, self).__set__(obj, value)

class FontSizeSpec(DataSpec):
    def __init__(self, default, help=None):
        super(FontSizeSpec, self).__init__(List(String), default=default, help=help)

    def __set__(self, obj, value):
        if isinstance(value, string_types):
            warn('Setting a fixed font size value as a string %r is deprecated, '
                 'set with value(%r) or [%r] instead' % (value, value, value),
                 DeprecationWarning, stacklevel=2)
            if len(value) > 0 and value[0].isdigit():
                value = dict(value=value)
        super(FontSizeSpec, self).__set__(obj, value)

class UnitsSpec(NumberSpec):
    def __init__(self, default, units_type, units_default, help=None):
        super(UnitsSpec, self).__init__(default=default, help=help)
        self._units_type = self._validate_type_param(units_type)
        self._units_type.validate(units_default)
        self._units_type._default = units_default

    def to_dict(self, obj):
        d = super(UnitsSpec, self).to_dict(obj)
        d["units"] = getattr(obj, self.name+"_units")
        return d

    def __set__(self, obj, value):
        if isinstance(value, dict):
            units = value.pop("units", None)
            if units: setattr(obj, self.name+"_units", units)
        super(UnitsSpec, self).__set__(obj, value)

    def __str__(self):
        val = getattr(self, self._name, self.default)
        return "%s(%r, units_default=%r)" % (self.__class__.__name__, val, self._units_type._default)

class AngleSpec(UnitsSpec):
    def __init__(self, default, units_default="rad", help=None):
        super(AngleSpec, self).__init__(default=default, units_type=Enum(enums.AngleUnits), units_default=units_default, help=help)

class DistanceSpec(UnitsSpec):
    def __init__(self, default, units_default="data", help=None):
        super(DistanceSpec, self).__init__(default=default, units_type=Enum(enums.SpatialUnits), units_default=units_default, help=help)

    def __set__(self, obj, value):
        try:
            if value < 0:
                raise ValueError("Distances must be non-negative")
        except TypeError:
            pass
        super(DistanceSpec, self).__set__(obj, value)

class ScreenDistanceSpec(NumberSpec):
    def to_dict(self, obj):
        d = super(ScreenDistanceSpec, self).to_dict(obj)
        d["units"] = "screen"
        return d

    def __set__(self, obj, value):
        try:
            if value < 0:
                raise ValueError("Distances must be non-negative")
        except TypeError:
            pass
        super(ScreenDistanceSpec, self).__set__(obj, value)

class DataDistanceSpec(NumberSpec):
    def to_dict(self, obj):
        d = super(ScreenDistanceSpec, self).to_dict(obj)
        d["units"] = "data"
        return d

    def __set__(self, obj, value):
        try:
            if value < 0:
                raise ValueError("Distances must be non-negative")
        except TypeError:
            pass
        super(DataDistanceSpec, self).__set__(obj, value)

class ColorSpec(DataSpec):
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

    def to_dict(self, obj):
        val = getattr(obj, self._name, self.default)

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
