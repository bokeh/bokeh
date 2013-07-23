""" A set of descriptors that document intended types for attributes on
classes and implement convenience behaviors like default values, etc.
"""

from copy import copy
import inspect
import numpy as np
import logging
logger = logging.getLogger(__name__)

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
        """ Called by the metaclass to create a
        new instance of this descriptor
        if the user just assigned it to a property without trailing
        parentheses.
        """
        return cls()

    def __get__(self, obj, type=None):
        return getattr(obj, "_"+self.name, self.default)
    
    def matches(self, new, old):
        try:
            return new == old
        except Exception as e:
            logger.warning("could not compare %s and %s for property %s",
                           new, old, self.name)
        return False
    
    def __set__(self, obj, value):
        old = self.__get__(obj)
        if self.matches(value, old):
            return
        setattr(obj, "_"+self.name, value)
        obj._dirty = True
        obj._changed_vars.add(self.name)
        if hasattr(obj, '_trigger'):
            if hasattr(obj, '_block_callbacks') and obj._block_callbacks:
                obj._callback_queue.append((self.name, old, value))
            else:
                obj._trigger(self.name, old, value)
            
    def __delete__(self, obj):
        if hasattr(obj, "_"+self.name):
            delattr(obj, "_"+self.name)


class Include(BaseProperty):

    def __init__(self, delegate, prefix=None):
        self._delegate = delegate
        self._prefix = prefix
        super(Include, self).__init__()


class MetaHasProps(type):
    def __new__(cls, class_name, bases, class_dict):
        names = set()
        names_with_refs = set()

        # First pre-process to handle all the Includes
        includes = {}
        removes = set()
        for name, prop in class_dict.iteritems():
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
                if isinstance(subprop, BaseProperty):
                    # If it's an actual instance, then we need to make a copy
                    # so two properties don't write to the same hidden variable
                    # inside the instance.
                    subprop = copy(subprop)
                includes[fullpropname] = subprop
            # Remove the name of the Include attribute itself
            removes.add(name)

        # Update the class dictionary, taking care not to overwrite values
        # from the delegates that the subclass may have explicitly defined
        for key, val in includes.iteritems():
            if key not in class_dict:
                class_dict[key] = val
        for tmp in removes:
            del class_dict[tmp]

        for name, prop in class_dict.iteritems():
            if isinstance(prop, BaseProperty):
                prop.name = name
                if hasattr(prop, 'has_ref') and prop.has_ref:
                    names_with_refs.add(name)
                names.add(name)
            elif isinstance(prop, type) and issubclass(prop, BaseProperty):
                # Support the user adding a property without using parens,
                # i.e. using just the BaseProperty subclass instead of an
                # instance of the subclass
                newprop = prop.autocreate(name=name)
                class_dict[name] = newprop
                newprop.name = name
                names.add(name)
        class_dict["__properties__"] = names
        class_dict["__properties_with_refs__"] = names_with_refs
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

class HasProps(object):
    __metaclass__ = MetaHasProps

    def __init__(self, *args, **kwargs):
        """ Set up a default initializer handler which assigns all kwargs
        that have the same names as Properties on the class
        """
        # Initialize the mutated property handling
        self._changed_vars = set()

        newkwargs = {}
        props = self.properties()
        for kw, val in kwargs.iteritems():
            if kw in props:
                setattr(self, kw, val)
            else:
                newkwargs[kw] = val
        # Dump the rest of the kwargs in self.dict
        self.__dict__.update(newkwargs)
        self._changed_vars.update(newkwargs.keys())
        super(HasProps, self).__init__(*args)

    def clone(self):
        """ Returns a duplicate of this object with all its properties
        set appropriately.  Values which are containers are shallow-copied.
        """
        d = dict((p,getattr(self, p)) for p in self.properties())
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
            s = self.__class__.class_properties()
            self.__cached_allprops = s
        return self.__cached_allprops

    def changed_vars(self):
        """ Returns which variables changed since the creation of the object,
        or the last called to reset_changed_vars().
        """
        return set.union(self._changed_vars, self.properties_with_refs())

    def reset_changed_vars(self):
        self._changed_vars = set()

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
        self.has_ref = has_ref
        
    def __get__(self, obj, type=None):
        # If the constructor for Instance() supplied a class name, we should
        # instantiate that class here, instead of returning the class as the
        # default object
        if not hasattr(obj, "_"+self.name):
             if type and self.default and isinstance(self.default, type):
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
        obj._dirty = True

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

# These classes can be mixed-in to HasProps classes to get them the 
# corresponding attributes
class FillProps(HasProps):
    """ Mirrors the BokehJS properties.fill_properties class """
    fill = Color("gray")
    fill_alpha = Percent(1.0)

class LineProps(HasProps):
    """ Mirrors the BokehJS properties.line_properties class """
    line_color = Color("black")
    line_width = Size(1)
    line_alpha = Percent(1.0)
    line_join = String("miter")
    line_cap = String("butt")
    line_dash = Pattern
    line_dash_offset = Int(0)

class TextProps(HasProps):
    """ Mirrors the BokehJS properties.text_properties class """
    text_font = String
    text_font_size = Int(10)
    text_font_style = Enum("normal", "italic", "bold")
    text_color = Color("black")
    text_alpha = Percent(1.0)
    text_align = Enum("left", "right", "center")
    text_baseline = Enum("top", "middle", "bottom")


