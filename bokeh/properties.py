""" A set of descriptors that document intended types for attributes on
classes and implement convenience behaviors like default values, etc.
"""

from copy import copy
import inspect
import numpy as np

def _dummy(*args,**kw):
    return None

class BaseProperty(object):
    def __init__(self, default=None):
        """ This is how the descriptor is created in the class declaration """
        self.default = default
        # This gets set by the class decorator at class creation time
        self.name = "unnamed"  

    @classmethod
    def autocreate(cls, name=None):
        """ Called by the metaclass to create a new instance of this descriptor
        if the user just assigned it to a property without trailing
        parentheses.
        """
        return cls()

    def __get__(self, obj, type=None):
        return getattr(obj, "_"+self.name, self.default)

    def __set__(self, obj, value):
        setattr(obj, "_"+self.name, value)

    def __delete__(self, obj):
        if hasattr(obj, "_"+self.name):
            delattr(obj, "_"+self.name)

class MetaHasProps(type):
    def __new__(cls, class_name, bases, class_dict):
        names = []
        for name, prop in class_dict.iteritems():
            if isinstance(prop, BaseProperty):
                prop.name = name
                names.append(name)
            elif isinstance(prop, type) and issubclass(prop, BaseProperty):
                # Support the user adding a property without using parens,
                # i.e. using just the BaseProperty subclass instead of an
                # instance of the subclass
                newprop = prop.autocreate(name=name)
                class_dict[name] = newprop
                newprop.name = name
                names.append(name)
        class_dict["__properties__"] = names
        return type.__new__(cls, class_name, bases, class_dict)

class HasProps(object):
    __metaclass__ = MetaHasProps

    def __init__(self, *args, **kwargs):
        """ Set up a default initializer handler which assigns all kwargs
        that have the same names as Properties on the class
        """
        newkwargs = {}
        for kw, val in kwargs.iteritems():
            if kw in self.__properties__:
                setattr(self, kw, val)
            else:
                newkwargs[kw] = val
        super(HasProps, self).__init__(*args, **newkwargs)


    def clone(self):
        """ Returns a duplicate of this object with all its properties
        set appropriately.  Values which are containers are shallow-copied.
        """
        d = dict((p,getattr(self, p)) for p in self.__properties__)
        return self.__class__(**d)

    def properties(self):
        """ Returns a set of the names of this object's properties. We
        traverse the class hierarchy and pull together the full
        list of properties.
        """
        s = set()
        for cls in inspect.getmro(self.__class__):
            if issubclass(cls, HasProps):
                s.update(cls.__properties__)
        return s

    def set(self, **kwargs):
        """ Sets a number of properties at once """
        for kw in kwargs:
            setattr(self, kw, kwargs[kw])

    def pprint_props(self, indent=0):
        """ Prints the properties of this object, nicely formatted """
        for p in self.__properties__:
            print "  "*indent + p + ":", getattr(self, p)

# Python scalar types
class Int(BaseProperty): pass
class Float(BaseProperty): pass
class Complex(BaseProperty): pass
class File(BaseProperty): pass
class Bool(BaseProperty): pass
class String(BaseProperty): pass

# container types
class List(BaseProperty):
    """ If a default value is passed in, then a shallow copy of it will be
    used for each new use of this property.
    """

    def __init__(self, default=[]):
        BaseProperty.__init__(self, default)

    def __get__(self, obj, type=None):
        if not hasattr(obj, "_"+self.name) and isinstance(self.default, list):
            setattr(obj, "_"+self.name, copy(self.default))
            return getattr(obj, "_"+self.name) and self.default is None
        else:
            return getattr(obj, "_"+self.name, self.default)

class Dict(BaseProperty):
    """ If a default value is passed in, then a shallow copy of it will be
    used for each new use of this property.
    """

    def __init__(self, default={}):
        BaseProperty.__init__(self, default)

    def __get__(self, obj, type=None):
        if not hasattr(obj, "_"+self.name) and isinstance(self.default, dict):
            setattr(obj, "_"+self.name, copy(self.default))
            return getattr(obj, "_"+self.name)
        else:
            return getattr(obj, "_"+self.name, self.default)

class Tuple(BaseProperty):

    def __init__(self, default=()):
        BaseProperty.__init__(self, default)

class Array(BaseProperty):
    """ Whatever object is passed in as a default value, np.asarray() is
    called on it to create a copy for the default value for each use of
    this property.
    """
    def __get__(self, obj, type=None):
        if not hasattr(obj, "_"+self.name) and self.default is not None:
            setattr(obj, "_"+self.name, np.asarray(self.default))
            return getattr(obj, "_"+self.name)
        else:
            return getattr(obj, "_"+self.name, self.default)

# OOP things
class Class(BaseProperty): pass
class Instance(BaseProperty): pass
class This(BaseProperty): pass

# Fake types, ABCs
class Any(BaseProperty): pass
class Function(BaseProperty): pass
class Event(BaseProperty): pass

class Either(BaseProperty):
    """ Takes a list of valid properties and validates against them in 
    succession.
    """
    # TODO: In order to implement this, we need to change all the properties
    # to use a .validate() method so they can be called programmatically from
    # this handler
    def __init__(self, *props, **kwargs):
        self._props = props
        self.default = kwargs.get("default", None)


class Enum(BaseProperty):
    """ An Enum with a list of allowed values. The first value in the list is
    the default value, unless a default is provided with the "default" keyword
    argument.
    """
    def __init__(self, *values, **kwargs):
        if "default" not in kwargs:
            if len(values) > 0:
                default = values[0]
            else:
                default = None
        else:
            default = kwargs.pop("default")
        self.default = default
        self.allowed_values = values

    def __set__(self, obj, value):
        if value not in self.allowed_values:
            raise ValueError("Invalid value '%r' passed to Enum." % value)
        setattr(obj, "_"+self.name, value)

Sequence = _dummy
Mapping = _dummy
Iterable = _dummy

# Properties useful for defining visual attributes
class Color(BaseProperty): pass
class Align(BaseProperty): pass
class Pattern(BaseProperty): pass
class Size(Float): pass
class Angle(Float): pass
class Percent(Float): pass

