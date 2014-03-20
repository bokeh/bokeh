""" A set of descriptors that document intended types for attributes on
classes and implement convenience behaviors like default values, etc.
"""
from __future__ import print_function

from importlib import import_module
from copy import copy
import inspect
import logging
logger = logging.getLogger(__name__)

from six import integer_types, string_types, add_metaclass
import numpy as np

from .enums import Enumeration, NamedColor

def _dummy(*args,**kw):
    return None

def nice_join(seq, sep=", "):
    seq = map(str, seq)

    if len(seq) <= 1:
        return sep.join(seq)
    else:
        return "%s or %s" % (sep.join(seq[:-1]), seq[-1])

class Property(object):
    def __init__(self, default=None):
        """ This is how the descriptor is created in the class declaration """
        self.validate(default)
        self.default = default
        # This gets set by the class decorator at class creation time
        self.name = "unnamed"

    @property
    def _name(self):
        return "_" + self.name

    @classmethod
    def autocreate(cls, name=None):
        """ Called by the metaclass to create a
        new instance of this descriptor
        if the user just assigned it to a property without trailing
        parentheses.
        """
        return cls()

    def matches(self, new, old):
        try:
            return new == old
        except Exception as e:
            logger.warning("could not compare %s and %s for property %s", new, old, self.name)
        return False

    def validate(self, value):
        pass

    def is_valid(self, value):
        try:
            self.validate(value)
        except ValueError:
            return False
        else:
            return True

    def __get__(self, obj, type=None):
        return getattr(obj, self._name, self.default)

    def __set__(self, obj, value):
        self.validate(value)
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


class Include(Property):

    def __init__(self, delegate, prefix=None):
        self._delegate = delegate
        self._prefix = prefix
        super(Include, self).__init__()


class DataSpec(Property):
    """ Because the BokehJS glyphs support a fixed value or a named
    field for most data fields, we capture that in this descriptor.
    Fields can have a fixed value, or be a name that is looked up
    on the datasource (usually as a column or record array field).
    A default value can also be provided for when a particular row
    in the datasource has a missing value.
    Numerical data can also have units of screen or data space.

    We mirror the JS convention in this Python descriptor.  For details,
    see renderers/properties.coffee in BokehJS, and specifically the
    select() function.

    There are multiple ways to set a DataSpec, illustrated below with comments
    and example code.

    Setting DataSpecs


    Simple example::

        class Foo(HasProps):
            x = DataSpec("x", units="data")

        f = Foo()
        f.x = "fieldname"  # Use the datasource field named "fieldname"
        f.x = 12           # A fixed value of 12
        f.x = ("foo", 16)  # a field name, and a default value

    Can provide a dict with the fields explicitly named::

        f.width = {"name": "foo", "default": 16}
        f.size = {"name": "foo", "units": "screen", "default": 16}

    Reading DataSpecs


    In the cases when the dataspec is set to just a field name or a
    fixed value, then those are returned.  If the user has overridden
    the default value in the DataSpec with a new default value, or
    if no values have been set, then the value of to_dict() is returned.

    In all cases, to determine the full dict that will be used to
    represent this dataspec, use the to_dict() method.

    Implementation


    The DataSpec instance is stored in the class dict, and acts as a
    descriptor.  Thus, it is shared between all instances of the class.
    Instance-specific data is stored in the instance dict, in a private
    variable named _[attrname].  This stores the actual value that the
    user last set (and does not exist if the user has not yet set the
    value).

    """

    def __init__(self, field=None, units="data", default=None, min_value=None):
        """
        Parameters
        ==========
        **field** is the string name of a data column to look up.
        **units** is either "data" or "screen"
        **default** is the default value to use if a datapoint is
        missing the field specified in **name**
        """
        # Don't use .name because the HasProps metaclass uses that to
        # store the attribute name on this descriptor.
        self.field = field
        self.units = units
        self.default = default
        self.min_value = min_value

    @classmethod
    def autocreate(cls, name=None):
        # In this case, use the name the user assigned this DataSpec to
        # as the default field name.
        d = cls(field=name)
        return d

    def __get__(self, obj, cls=None):
        """ Try to implement a "natural" interface: if the user just set
        simple values or field names, the getter just returns those.
        However, if the user has also overridden the "units" or "default"
        settings, then a dictionary is returned.
        """
        if hasattr(obj, self._name):
            setval = getattr(obj, self._name)
            if isinstance(setval, string_types) and self.default is None:
                # A string representing the field
                return setval
            elif not isinstance(setval, dict):
                # Typically a number presenting the fixed value
                return setval
            else:
                return self.to_dict(obj)
        else:
            # If the user hasn't set anything, just return the field name
            # if there are not defaults, or a dict with the field name
            # and the default value.
            if self.default is not None:
                return {"field": self.field, "default": self.default}
            else:
                return self.field

    def __set__(self, obj, arg):
        if isinstance(arg, tuple):
            # Note: tuples of length 2 are assumed to be (field, default)
            # other (longer) tuples might be color, e.g.
            if len(arg) == 2:
                field, default = arg
                if not isinstance(field, string_types):
                    raise RuntimeError("String is required for field name when assigning tuple to a DataSpec")
                arg = {"field": field, "default": default}
        super(DataSpec, self).__set__(obj, arg)

    def to_dict(self, obj):
        # Build the complete dict
        setval = getattr(obj, self._name, None)
        if isinstance(setval, string_types):
            d = {"field": setval, "units": self.units}
            if self.default is not None:
                d["default"] = self.default
        elif isinstance(setval, dict):
            d = {"units": self.units, "default": self.default}
            d.update(setval)
            if d["default"] is None:
                del d["default"]
            if "value" in d and "default" in d:
                del d["default"]
        elif setval is not None:
            # a fixed value of some sort; no need to store the default value
            d = {"value": setval, "units": self.units}
        else:
            # If the user never set a value
            d = {"field": self.field, "units": self.units}
            if self.default is not None:
                d["default"] = self.default

        if "value" in d and self.min_value is not None:
            if d["value"] < self.min_value:
                raise ValueError("value must be greater than %s" % str(self.min_value))
        return d

    def __repr__(self):
        return "DataSpec(field=%r, units=%r, default=%r)" % (
            self.field, self.units, self.default)


class ColorSpec(DataSpec):
    """ Subclass of DataSpec for specifying colors.

    Although this serves the same role as a DataSpec, its usage is somewhat
    different because:

    * Specifying a fixed value is much more common
    * Strings can be both field identifiers or refer to one of the SVG
      Named Colors (or be a hex value starting with "#")
    * There are no units

    For colors, because we support named colors and hex values prefaced
    with a "#", when we are handed a string value, there is a little
    interpretation: if the value is one of the 147 SVG named colors or
    it starts with a "#", then it is interpreted as a value.  Otherwise,
    it is treated as a field name.

    If a 3-tuple is provided, then it is treated as an RGB (0..255).
    If a 4-tuple is provided, then it is treated as an RGBa (0..255), with
    alpha as a float between 0 and 1.  (This follows the HTML5 Canvas API.)

    If a 2-tuple is provided, then it is treated as (value/fieldname, default).
    This is the same as the behavior in the base class DataSpec.
    Unlike DataSpec, ColorSpecs do not have a "units" property.

    When reading out a ColorSpec, it returns a tuple, hex value, field name,
    or a dict of (field, default).

    There are two common use cases for ColorSpec: setting a constant value,
    and indicating a field name to look for on the datasource::

        class Bar(HasProps):
            col = ColorSpec("green")
            col2 = ColorSpec("colorfield")
            col3 = ColorSpec("colorfield", default="aqua")

    >>> b = Bar()
    >>> b.col = "red"  # sets a fixed value of red
    >>> b.col
    "red"
    >>> b.col = "myfield"  # Use the datasource field named "myfield"
    >>> b.col
    "myfield"
    >>> b.col = {"name": "mycolor", "default": "#FF126D"}

    For more examples, see tests/test_glyphs.py
    """

    NAMEDCOLORS = set(NamedColor._values)

    def __init__(self, field_or_value=None, field=None, default=None, value=None):
        """ ColorSpec(field_or_value=None, field=None, default=None, value=None)
        """
        # The fancy footwork below is so we auto-interpret the first positional
        # parameter as either a field or a fixed value.  If either "field" or
        # "value" are then supplied as keyword arguments, then those will
        # override the inferred value from the positional argument.

        self.field = field
        self.default = default
        self.value = value
        if field_or_value is not None:
            if self.isconst(field_or_value):
                self.value = field_or_value
            else:
                self.field = field_or_value

        # We need to distinguish if the user ever explicitly sets the attribute; if
        # they explicitly set it to None, we should pass on None in the dict. Otherwise,
        # look up a default or value
        self._isset = False

    @classmethod
    def isconst(cls, arg):
        """ Returns True if the argument is a literal color.  Check for a
        well-formed hexadecimal color value.
        """
        return isinstance(arg, string_types) and \
               ((len(arg) == 7 and arg[0] == "#") or arg in cls.NAMEDCOLORS)

    def _formattuple(self, colortuple):
        if isinstance(colortuple, tuple):
            if len(colortuple) == 3:
                return "rgb%r" % (colortuple,)
            else:
                return "rgba%r" % (colortuple,)
        else:
            return colortuple

    def __get__(self, obj, cls=None):
        # One key difference in ColorSpec.__get__ from the base class is
        # that we do not call self.to_dict() in any circumstance, because
        # this could lead to formatting color tuples as "rgb(R,G,B)" instead
        # of keeping them as tuples.
        if hasattr(obj, self._name):
            setval = getattr(obj, self._name)
            if self.isconst(setval) or isinstance(setval, tuple):
                # Fixed color value
                return setval
            elif isinstance(setval, string_types):
                if self.default is None:
                    # Field name
                    return setval
                else:
                    return {"field": setval, "default": self.default}
            elif setval is None:
                return None
                return {"value": None}
            else:
                # setval should be a dict at this point
                assert(isinstance(setval, dict))
                return setval
        else:
            if self.value is not None:
                return self.value
            elif self.default is not None:
                return {"field": self.field, "default": self.default}
            else:
                return self.field

    def __set__(self, obj, arg):
        self._isset = True
        if isinstance(arg, tuple):
            if len(arg) == 2:
                if not isinstance(arg[0], string_types):
                    raise RuntimeError("String is required for field name when assigning 2-tuple to ColorSpec")
                arg = {"field": arg[0], "default": arg[1]}
            elif len(arg) in (3, 4):
                # RGB or RGBa
                pass
            else:
                raise RuntimeError("Invalid tuple being assigned to ColorSpec; must be length 2, 3, or 4.")
        super(ColorSpec, self).__set__(obj, arg)

    def to_dict(self, obj):
        setval = getattr(obj, self._name, None)
        if setval is not None:
            if self.isconst(setval):
                # Hexadecimal or named color
                return {"value": setval}
            elif isinstance(setval, tuple):
                # RGB or RGBa
                # TODO: Should we validate that alpha is between 0..1?
                return {"value": self._formattuple(setval)}
            elif isinstance(setval, string_types):
                d = {"field": setval}
                if self.default is not None:
                    d["default"] = self._formattuple(self.default)
                return d
            elif isinstance(setval, dict):
                # this is considerably simpler than the DataSpec case because
                # there are no units involved, and we've handled all of the
                # value cases above.
                d = setval.copy()
                if isinstance(d.get("default", None), tuple):
                    d["default"] = self._formattuple(d["default"])
                return d
        else:
            if self._isset:
                return {"value": None}
            # If the user never set a value
            if self.value is not None:
                return {"value": self.value}
            else:
                d = {"field": self.field}
                if self.default is not None:
                    d["default"] = self._formattuple(self.default)
                return d

    def __repr__(self):
        return "ColorSpec(field=%r, default=%r)" % (self.field, self.default)


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

            delegate = prop._delegate
            if not (isinstance(delegate,type) and issubclass(delegate,HasProps)):
                continue

            if prop._prefix is None:
                prefix = name + "_"
            else:
                prefix = prop._prefix + "_"
            for subpropname in delegate.class_properties(withbases=False):
                fullpropname = prefix + subpropname
                subprop = lookup_descriptor(delegate, subpropname)
                if isinstance(subprop, Property):
                    # If it's an actual instance, then we need to make a copy
                    # so two properties don't write to the same hidden variable
                    # inside the instance.
                    subprop = copy(subprop)
                includes[fullpropname] = subprop
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
        for name, prop in class_dict.items():
            if isinstance(prop, Property):
                prop.name = name
                if hasattr(prop, 'has_ref') and prop.has_ref:
                    names_with_refs.add(name)
                elif isinstance(prop, ContainerProperty):
                    container_names.add(name)
                names.add(name)
                if isinstance(prop, DataSpec):
                    dataspecs[name] = prop

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

def lookup_descriptor(cls, propname):
    for c in inspect.getmro(cls):
        if issubclass(c, HasProps) and propname in c.__dict__:
            return c.__dict__[propname]
    raise KeyError("Property '%s' not found on class '%s'" % (propname, cls))

@add_metaclass(MetaHasProps)
class HasProps(object):
    def __init__(self, **kwargs):
        """ Set up a default initializer handler which assigns all kwargs
        that have the same names as Properties on the class
        """
        # Initialize the mutated property handling
        self._changed_vars = set()

        props = self.properties()
        for key, value in kwargs.items():
            if key in props:
                setattr(self, key, value)
            else:
                raise AttributeError("unexpected attribute %s to %s, possible attributes are %s" %
                    (key, self.__class__.__name__, nice_join(props)))

        super(HasProps, self).__init__()

    def to_dict(self):
        return dict((prop, getattr(self, prop)) for prop in self.properties())

    def clone(self):
        """ Returns a duplicate of this object with all its properties
        set appropriately.  Values which are containers are shallow-copied.
        """
        return self.__class__(**self.to_dict())

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

    def changed_properties_with_values(self):
        return dict([ (attr, getattr(self, attr)) for attr in self.changed_vars() ])

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

    _underlying_type = None

    def validate(self, value):
        super(PrimitiveProperty, self).validate(value)

        if not (value is None or isinstance(value, self._underlying_type)):
            raise ValueError("expected a value of type %s, got %s of type %s" %
                (nice_join([ cls.__name__ for cls in self._underlying_type ]), value, type(value).__name__))

class Bool(PrimitiveProperty):
    _underlying_type = (bool,)

class Int(PrimitiveProperty):
    _underlying_type = integer_types

class Float(PrimitiveProperty):
    _underlying_type = (float,) + integer_types

class Complex(PrimitiveProperty):
    _underlying_type = (complex, float) + integer_types

class String(PrimitiveProperty):
    _underlying_type = string_types

class ContainerProperty(Property):
    # Base class for container-like things; this helps the auto-serialization
    # and attribute change detection code
    pass

# container types
class List(ContainerProperty):
    """ If a default value is passed in, then a shallow copy of it will be
    used for each new use of this property.

    People will also frequently pass in some other kind of property or a
    class (to indicate a list of instances).  In those cases, we want to
    just create an empty list

    has_ref parameter tells us whether the json representation of this
    list contains references to other objects
    """

    def __init__(self, item_type, default=None, has_ref=False):
        if isinstance(item_type, type):
            if issubclass(item_type, Property):
                item_type = item_type()
            else:
                raise ValueError("expected a property as type parameter, got %s" % item_type.__name__)
        elif not isinstance(item_type, Property):
            raise ValueError("expected a property as type parameter, got %s" % item_type)

        self.item_type = item_type
        self.has_ref = has_ref

        super(List, self).__init__(default=default)

    def validate(self, value):
        super(List, self).validate(value)

        if value is not None:
            if not (isinstance(value, list) and all(self.item_type.is_valid(item) for item in value)):
                raise ValueError("expected an element of %s, got %s" % (self, value))

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, self.item_type)

    def __get__(self, obj, type=None):
        if hasattr(obj, self._name):
            return getattr(obj, self._name)
        if self.default is None:
            val = []
        elif isinstance(self.default, list):
            val = copy(self.default)
        else:
            val = self.default
        setattr(obj, self._name, val)
        return val

class Dict(ContainerProperty):
    """ If a default value is passed in, then a shallow copy of it will be
    used for each new use of this property.

    has_ref parameter tells us whether the json representation of this
    list contains references to other objects
    """

    def __init__(self, default={}, has_ref=False):
        Property.__init__(self, default)
        self.has_ref = has_ref

    def __get__(self, obj, type=None):
        if not hasattr(obj, self._name) and isinstance(self.default, dict):
            setattr(obj, self._name, copy(self.default))
            return getattr(obj, self._name)
        else:
            return getattr(obj, self._name, self.default)

class Tuple(ContainerProperty):

    def __init__(self, default=()):
        Property.__init__(self, default)

class Array(ContainerProperty):
    """ Whatever object is passed in as a default value, np.asarray() is
    called on it to create a copy for the default value for each use of
    this property.
    """
    def __get__(self, obj, type=None):
        if not hasattr(obj, self._name) and self.default is not None:
            setattr(obj, self._name, np.asarray(self.default))
            return getattr(obj, self._name)
        else:
            return getattr(obj, self._name, self.default)

# OOP things
class Class(Property):
    pass

class Instance(Property):
    def __init__(self, instance_type, default=None, has_ref=False):
        """has_ref : whether the json for this is a reference to
        another object or not
        """
        if not isinstance(instance_type, (type, str)):
            raise ValueError("expected a type, got %s" % instance_type)

        self._instance_type = instance_type
        self.has_ref = has_ref

        super(Instance, self).__init__(default=default)

    @property
    def instance_type(self):
        if isinstance(self._instance_type, str):
            module, name = self._instance_type.rsplit(".", 1)
            self._instance_type = getattr(import_module(module, "bokeh"), name)

        return self._instance_type

    def __get__(self, obj, type=None):
        # If the constructor for Instance() supplied a class name, we should
        # instantiate that class here, instead of returning the class as the
        # default object
        if not hasattr(obj, self._name):
             if type and self.default and isinstance(self.default, type):
                setattr(obj, self._name, self.default())
        return getattr(obj, self._name, None)

    def validate(self, value):
        super(Instance, self).validate(value)

        if value is not None:
            if not isinstance(value, self.instance_type):
                raise ValueError("expected an instance of type %s, got %s of type %s" %
                    (self.instance_type.__name__, value, type(value).__name__))

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, self.instance_type.__name__)

class This(Property):
    """ A reference to an instance of the class being defined
    """
    pass

# Fake types, ABCs
class Any(Property): pass
class Function(Property): pass
class Event(Property): pass

class Either(Property):
    """ Takes a list of valid properties and validates against them in
    succession.
    """
    # TODO: In order to implement this, we need to change all the properties
    # to use a .validate() method so they can be called programmatically from
    # this handler
    def __init__(self, *props, **kwargs):
        self._props = props
        self.default = kwargs.get("default", None)


class Enum(Property):
    """ An Enum with a list of allowed values. The first value in the list is
    the default value, unless a default is provided with the "default" keyword
    argument.
    """
    def __init__(self, *values, **kwargs):
        if len(values) == 1 and isinstance(values[0], Enumeration):
            enum_type = values[0]
            values = enum_type._values
            default = enum_type._default
        else:
            if "default" not in kwargs:
                if len(values) > 0:
                    default = values[0]
                else:
                    default = None
            else:
                default = kwargs.pop("default")

        self.default = default
        self.allowed_values = values

    def validate(self, value):
        super(Enum, self).validate(value)

        if not (value is None or value in self.allowed_values):
            raise ValueError("invalid value %r, allowed values are %s" % (value, nice_join(self.allowed_values)))

Sequence = _dummy
Mapping = _dummy
Iterable = _dummy

# Properties useful for defining visual attributes
class Color(Property):
    """ Accepts color definition in a variety of ways, and produces an
    appropriate serialization of its value for whatever backend
    """
    # TODO: Implement this.  Valid inputs: SVG named 147, 3-tuple, 4-tuple with
    # appropriate options for baking in alpha, hex code.  Tuples should allow
    # both float as well as integer.


class Align(Property): pass

class DashPattern(Property):
    """
    This is a property that expresses line dashes.  It can be specified in
    a variety of forms:

    * "solid", "dashed", "dotted", "dotdash", "dashdot"
    * A tuple or list of integers in the HTML5 Canvas dash specification
      style: http://www.w3.org/html/wg/drafts/2dcontext/html5_canvas/#dash-list
      Note that if the list of integers has an odd number of elements, then
      it is duplicated, and that duplicated list becomes the new dash list.
    * A string of integers with spaces separating them. This is broken up into
      a list and then treated like the above.

    If dash is turned off, then the dash pattern is the empty list [].
    """

    dashmap = {
        "solid": [],
        "dashed": [6],
        "dotted": [2,4],
        "dotdash": [2,4,6,4],
        "dashdot": [6,4,2,4],
    }

    def __init__(self, default=[]):
        Property.__init__(self, default)

    def __set__(self, obj, arg):
        if isinstance(arg, str):
            if arg in self.dashmap:
                arg = self.dashmap[arg]
            else:
                try:
                    arg = [int(x) for x in arg.split()]
                except:
                    raise ValueError("Invalid string value for dash pattern: '%s'" % arg)
        elif isinstance(arg, tuple) or isinstance(arg, list):
            for x in arg:
                if not isinstance(x, int):
                    raise ValueError("list/tuple values for dash patterns must contain only integers")
        else:
            raise ValueError("Invalid value assigned to Pattern; "
                             "must be list or tuple of integers, or string; "
                             "strings must be space delimited integers, e.g. '2 4 3 2' "
                             "or one of the names: 'solid','dashed','dotted','dotdash','dashdot'.")

        super(DashPattern, self).__set__(obj, arg)

class Size(Float):
    """ Equivalent to an unsigned int """
    def validate(self, value):
        super(Size, self).validate(value)

        if not (value is None or 0.0 <= value):
            raise ValueError("expected a non-negative number, got %s" % value)

class Percent(Float):
    """ Percent is useful for alphas and coverage and extents; more
    semantically meaningful than Float(0..1)
    """
    def validate(self, value):
        super(Percent, self).validate(value)

        if not (value is None or 0.0 <= value <= 1.0):
            raise ValueError("expected a value in range [0, 1], got %s" % value)

class Angle(Float):
    pass
