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
        names_with_refs = []
        for name, prop in class_dict.iteritems():
            if isinstance(prop, BaseProperty):
                prop.name = name
                if hasattr(prop, 'has_ref') and prop.has_ref:
                    names_with_refs.append(name)
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
        class_dict["__properties_with_refs__"] = names_with_refs
        return type.__new__(cls, class_name, bases, class_dict)
    
def accumulate_from_subclasses(cls, propname):
    s = set()
    for c in inspect.getmro(cls):
        if issubclass(c, HasProps):
            s.update(getattr(cls, propname))
    return s

class HasProps(object):
    __metaclass__ = MetaHasProps

    def __init__(self, *args, **kwargs):
        """ Set up a default initializer handler which assigns all kwargs
        that have the same names as Properties on the class
        """
        newkwargs = {}
        props = self.properties()
        for kw, val in kwargs.iteritems():
            if kw in props:
                setattr(self, kw, val)
            else:
                newkwargs[kw] = val
        # Dump the rest of the kwargs in self.dict
        self.__dict__.update(newkwargs)
        super(HasProps, self).__init__(*args)

    def clone(self):
        """ Returns a duplicate of this object with all its properties
        set appropriately.  Values which are containers are shallow-copied.
        """
        d = dict((p,getattr(self, p)) for p in self.__properties__)
        return self.__class__(**d)

    def properties_with_refs(self):
        """ Returns a set of the names of this object's properties that
        have references. We traverse the class hierarchy and
        pull together the full list of properties.
        """
        if not hasattr(self, "__cached_allprops_with_refs"):
            s = accumulate_from_subclasses(self.__class__,
                                           "__properties_with_refs__")
            self.__cached_allprops_with_refs = s
        return self.__cached_allprops_with_refs

    def properties(self):
        """ Returns a set of the names of this object's properties. We
        traverse the class hierarchy and pull together the full
        list of properties.
        """
        if not hasattr(self, "__cached_allprops"):
            s = accumulate_from_subclasses(self.__class__,
                                           "__properties__")
            self.__cached_allprops = s
        return self.__cached_allprops

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

    People will also frequently pass in some other kind of property or a
    class (to indicate a list of instances).  In those cases, we want to 
    just create an empty list

    has_ref parameter tells us whether the json representation of this
    list contains references to other objects
    """

    def __init__(self, default=None, has_ref=False):
        if isinstance(default, type) or isinstance(default, BaseProperty):
            default = None
        self.has_ref = has_ref
        BaseProperty.__init__(self, default)

    def __get__(self, obj, type=None):
        if hasattr(obj, "_"+self.name):
            return getattr(obj, "_"+self.name)
        if self.default is None:
            val = []
        elif isinstance(self.default, list):
            val = copy(self.default)
        else:
            val = self.default
        setattr(obj, "_"+self.name, val)
        return val

class Dict(BaseProperty):
    """ If a default value is passed in, then a shallow copy of it will be
    used for each new use of this property.

    has_ref parameter tells us whether the json representation of this
    list contains references to other objects
    """

    def __init__(self, default={}, has_ref=False):
        BaseProperty.__init__(self, default)
        self.has_ref = has_ref
        
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
class Instance(BaseProperty):
    def __init__(self, default=None, has_ref=False):
        """has_ref : whether the json for this is a reference to
        another object or not
        """
        super(Instance, self).__init__(default=default)
        self.has_ref = True
        
    def __get__(self, obj, type=None):
        # If the constructor for Instance() supplied a class name, we should
        # instantiate that class here, instead of returning the class as the
        # default object
        if not hasattr(obj, "_"+self.name):
            if self.default and isinstance(self.default, type):
                setattr(obj, "_"+self.name, self.default())
        return getattr(obj, "_"+self.name, None)

class This(BaseProperty): 
    """ A reference to an instance of the class being defined
    """
    pass

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
class Color(BaseProperty):
    """ Accepts color definition in a variety of ways, and produces an 
    appropriate serialization of its value for whatever backend
    """
    # TODO: Implement this.  Valid inputs: SVG named 147, 3-tuple, 4-tuple with
    # appropriate options for baking in alpha, hex code.  Tuples should allow
    # both float as well as integer.


class Align(BaseProperty): pass
class Pattern(BaseProperty): pass
class Size(Float):
    """ Equivalent to an unsigned int """

class Angle(Float): pass

class Percent(Float):
    """ Percent is useful for alphas and coverage and extents; more
    semantically meaningful than Float(0..1) 
    """


