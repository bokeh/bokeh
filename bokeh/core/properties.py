''' Properties are objects that can be assigned as class attributes on Bokeh
models, to provide automatic serialization, validation, and documentation.

This documentation is broken down into the following sections:

.. contents::
    :local:

Overview
--------

There are many property types defined in the module, for example ``Int`` to
represent integral values, ``Seq`` to represent sequences (e.g. lists or
tuples, etc.). Properties can also be combined: ``Seq(Float)`` represents
a sequence of floating point values.

For example, the following defines a model that has integer, string, and
list[float] properties:

.. code-block:: python

    class SomeModel(Model):
        foo = Int
        bar = String(default="something")
        baz = List(Float, help="docs for baz prop")

As seen, properties can be declared as just the property type, e.g.
``foo = Int``, in which case the properties are automatically instantiated
on new Model objects. Or the property can be instantiated on the class,
and configured with default values and help strings.

The properties of this class can be initialized by specifying keyword
arguments to the initializer:

.. code-block:: python

    m = SomeModel(foo=10, bar="a str", baz=[1,2,3,4])

But also by setting the attributes on an instance:

.. code-block:: python

    m.foo = 20

Attempts to set a property to a value of the wrong type will
result in a ``ValueError`` exception:

.. code-block:: python

    >>> m.foo = 2.3
    Traceback (most recent call last):

      << traceback omitted >>

    ValueError: expected a value of type Integral, got 2.3 of type float

Models with properties know how to serialize themselves, to be understood
by BokehJS. Additionally, any help strings provided on properties can be
easily and automatically extracted with the Sphinx extensions in the
:ref:`bokeh.sphinxext` module.


Basic Properties
----------------

%s

Container Properties
--------------------

%s

DataSpec Properties
-------------------

%s

Helpers
~~~~~~~

.. autofunction:: field
.. autofunction:: value


Special Properties
------------------

.. autoclass:: Include
.. autoclass:: Override

'''
from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__name__)

import collections
from copy import copy
import datetime
import dateutil.parser
from importlib import import_module
import numbers
import re

from six import string_types, iteritems

from ..colors import RGB
from ..util.dependencies import import_optional
from ..util.deprecation import deprecated
from ..util.serialization import transform_column_source_data, decode_base64_dict
from ..util.string import nice_join
from .property.bases import ContainerProperty, DeserializationError, ParameterizedProperty, Property, PrimitiveProperty
from .property.descriptor_factory import PropertyDescriptorFactory
from .property.descriptors import BasicPropertyDescriptor, DataSpecPropertyDescriptor, UnitsSpecPropertyDescriptor
from . import enums

pd = import_optional('pandas')

# TODO: this should really be moved elsewhere, has_props.py or model.py
def abstract(cls):
    from .has_props import HasProps
    ''' A phony decorator to mark abstract base classes. '''
    if not issubclass(cls, HasProps):
        raise TypeError("%s is not a subclass of HasProps" % cls.__name__)

    return cls

bokeh_bool_types = (bool,)
try:
    import numpy as np
    bokeh_bool_types += (np.bool8,)
except ImportError:
    pass

bokeh_integer_types = (numbers.Integral,)

class Bool(PrimitiveProperty):
    ''' Accept boolean values.

    Args:
        default (obj or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

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

    Example:

        .. code-block:: python

            >>> class BoolModel(HasProps):
            ...     prop = Bool(default=False)
            ...

            >>> m = BoolModel()

            >>> m.prop = True

            >>> m.prop = False

            >>> m.prop = 10  # ValueError !!

    '''
    _underlying_type = bokeh_bool_types

class Int(PrimitiveProperty):
    ''' Accept signed integer values.

    Args:
        default (int or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

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

    Example:

        .. code-block:: python

            >>> class IntModel(HasProps):
            ...     prop = Int()
            ...

            >>> m = IntModel()

            >>> m.prop = 10

            >>> m.prop = -200

            >>> m.prop = 10.3  # ValueError !!

    '''
    _underlying_type = bokeh_integer_types

class Float(PrimitiveProperty):
    ''' Accept floating point values.

    Args:
        default (float or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

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

    Example:

        .. code-block:: python

            >>> class FloatModel(HasProps):
            ...     prop = Float()
            ...

            >>> m = FloatModel()

            >>> m.prop = 10

            >>> m.prop = 10.3

            >>> m.prop = "foo"  # ValueError !!


    '''
    _underlying_type = (numbers.Real,)

class Complex(PrimitiveProperty):
    ''' Accept complex floating point values.

    Args:
        default (complex or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

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

    '''
    _underlying_type = (numbers.Complex,)

class String(PrimitiveProperty):
    ''' Accept string values.

    Args:
        default (string or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

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

    Example:

        .. code-block:: python

            >>> class StringModel(HasProps):
            ...     prop = String()
            ...

            >>> m = StringModel()

            >>> m.prop = "foo"

            >>> m.prop = 10.3       # ValueError !!

            >>> m.prop = [1, 2, 3]  # ValueError !!

    '''
    _underlying_type = string_types

class Regex(String):
    ''' Accept strings that match a given regular expression.

    Args:
        default (string or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

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

    Example:

        .. code-block:: python

            >>> class RegexModel(HasProps):
            ...     prop = Regex("foo[0-9]+bar")
            ...

            >>> m = RegexModel()

            >>> m.prop = "foo123bar"

            >>> m.prop = "foo"      # ValueError !!

            >>> m.prop = [1, 2, 3]  # ValueError !!

    '''
    def __init__(self, regex, default=None, help=None):
        self.regex = re.compile(regex)
        super(Regex, self).__init__(default=default, help=help)

    def __str__(self):
        return "%s(%r)" % (self.__class__.__name__, self.regex.pattern)

    def validate(self, value):
        super(Regex, self).validate(value)

        if not (value is None or self.regex.match(value) is not None):
            raise ValueError("expected a string matching %r pattern, got %r" % (self.regex.pattern, value))

class JSON(String):
    ''' Accept JSON string values.

    The value is transmitted and received by BokehJS as a *string*
    containing JSON content. i.e., you must use ``JSON.parse`` to unpack
    the value into a JavaScript hash.

    Args:
        default (string or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

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

    '''
    def validate(self, value):
        super(JSON, self).validate(value)

        if value is None: return

        try:
            import json
            json.loads(value)
        except ValueError:
            raise ValueError("expected JSON text, got %r" % value)

class Instance(Property):
    ''' Accept values that are instances of |HasProps|.



    '''
    def __init__(self, instance_type, default=None, help=None):
        if not isinstance(instance_type, (type,) + string_types):
            raise ValueError("expected a type or string, got %s" % instance_type)

        from .has_props import HasProps
        if isinstance(instance_type, type) and not issubclass(instance_type, HasProps):
            raise ValueError("expected a subclass of HasProps, got %s" % instance_type)

        self._instance_type = instance_type

        super(Instance, self).__init__(default=default, help=help)

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, self.instance_type.__name__)

    @property
    def has_ref(self):
        return True

    @property
    def instance_type(self):
        if isinstance(self._instance_type, str):
            module, name = self._instance_type.rsplit(".", 1)
            self._instance_type = getattr(import_module(module, "bokeh"), name)

        return self._instance_type

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
                    prop_descriptor = self.instance_type.lookup(name).property
                    attrs[name] = prop_descriptor.from_json(value, models)

                # XXX: this doesn't work when Instance(Superclass) := Subclass()
                # Serialization dict must carry type information to resolve this.
                return self.instance_type(**attrs)
        else:
            raise DeserializationError("%s expected a dict or None, got %s" % (self, json))

    def validate(self, value):
        super(Instance, self).validate(value)

        if value is not None:
            if not isinstance(value, self.instance_type):
                raise ValueError("expected an instance of type %s, got %s of type %s" %
                    (self.instance_type.__name__, value, type(value).__name__))

    def _has_stable_default(self):
        # because the instance value is mutable
        return False

    def _sphinx_type(self):
        fullname = "%s.%s" % (self.instance_type.__module__, self.instance_type.__name__)
        return self._sphinx_prop_link() + "( %s )" % self._sphinx_model_link(fullname)

class Any(Property):
    ''' Accept all values.

    The ``Any`` property does not do any validation or transformation.

    Args:
        default (obj or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

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

    Example:

        .. code-block:: python

            >>> class AnyModel(HasProps):
            ...     prop = Any()
            ...

            >>> m = AnyModel()

            >>> m.prop = True

            >>> m.prop = 10

            >>> m.prop = 3.14

            >>> m.prop = "foo"

            >>> m.prop = [1, 2, 3]

    '''
    pass

class Interval(ParameterizedProperty):
    ''' Accept numeric values that are contained within a given interval.

    Args:
        interval_type (numeric property):
            numeric types for the range, e.g. ``Int``, ``Float``

        start (number) :
            A minimum allowable value for the range. Values less than
            ``start`` will result in validation errors.

        end (number) :
            A maximum allowable value for the range. Values greater than
            ``end`` will result in validation errors.

    Example:

        .. code-block:: python

            >>> class RangeModel(HasProps):
            ...     prop = Range(Float, 10, 20)
            ...

            >>> m = RangeModel()

            >>> m.prop = 10

            >>> m.prop = 20

            >>> m.prop = 15

            >>> m.prop = 2     # ValueError !!

            >>> m.prop = 22    # ValueError !!

            >>> m.prop = "foo" # ValueError !!

    '''
    def __init__(self, interval_type, start, end, default=None, help=None):
        self.interval_type = self._validate_type_param(interval_type)
        # Make up a property name for validation purposes
        self.interval_type.validate(start)
        self.interval_type.validate(end)
        self.start = start
        self.end = end
        super(Interval, self).__init__(default=default, help=help)

    def __str__(self):
        return "%s(%s, %r, %r)" % (self.__class__.__name__, self.interval_type, self.start, self.end)

    @property
    def type_params(self):
        return [self.interval_type]

    def validate(self, value):
        super(Interval, self).validate(value)

        if not (value is None or self.interval_type.is_valid(value) and value >= self.start and value <= self.end):
            raise ValueError("expected a value of type %s in range [%s, %s], got %r" % (self.interval_type, self.start, self.end, value))

class Byte(Interval):
    ''' Accept integral byte values (0-255).

    Example:

        .. code-block:: python

            >>> class ByteModel(HasProps):
            ...     prop = Byte(default=0)
            ...

            >>> m = ByteModel()

            >>> m.prop = 255

            >>> m.prop = 256  # ValueError !!

            >>> m.prop = 10.3 # ValueError !!

    '''
    def __init__(self, default=0, help=None):
        super(Byte, self).__init__(Int, 0, 255, default=default, help=help)

class Either(ParameterizedProperty):
    ''' Accept values according to a sequence of other property types.

        Example:

        .. code-block:: python

            >>> class EitherModel(HasProps):
            ...     prop = Either(Bool, Int, Auto)
            ...

            >>> m = EitherModel()

            >>> m.prop = True

            >>> m.prop = 10

            >>> m.prop = "auto"

            >>> m.prop = 10.3   # ValueError !!

            >>> m.prop = "foo"  # ValueError !!

    '''

    def __init__(self, tp1, tp2, *type_params, **kwargs):
        self._type_params = list(map(self._validate_type_param, (tp1, tp2) + type_params))
        help = kwargs.get("help")
        def choose_default():
            return self._type_params[0]._raw_default()
        default = kwargs.get("default", choose_default)
        super(Either, self).__init__(default=default, help=help)

    # TODO (bev) get rid of this?
    def __or__(self, other):
        return self.__class__(*(self.type_params + [other]), default=self._default, help=self.help)

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, ", ".join(map(str, self.type_params)))

    @property
    def type_params(self):
        return self._type_params

    def from_json(self, json, models=None):
        for tp in self.type_params:
            try:
                return tp.from_json(json, models)
            except DeserializationError:
                pass
        else:
            raise DeserializationError("%s couldn't deserialize %s" % (self, json))

    def transform(self, value):
        for param in self.type_params:
            try:
                return param.transform(value)
            except ValueError:
                pass

        raise ValueError("Could not transform %r" % value)

    def validate(self, value):
        super(Either, self).validate(value)

        if not (value is None or any(param.is_valid(value) for param in self.type_params)):
            raise ValueError("expected an element of either %s, got %r" % (nice_join(self.type_params), value))

    def _sphinx_type(self):
        return self._sphinx_prop_link() + "( %s )" % ", ".join(x._sphinx_type() for x in self.type_params)

class Enum(String):
    ''' Accept values from enumerations.

    The first value in enumeration is used as the default value, unless the
    ``default`` keyword argument is used.

    See :ref:`bokeh.core.enums` for more information.

    '''
    def __init__(self, enum, *values, **kwargs):
        if not (not values and isinstance(enum, enums.Enumeration)):
            enum = enums.enumeration(enum, *values)

        self._enum = enum

        default = kwargs.get("default", enum._default)
        help = kwargs.get("help")

        super(Enum, self).__init__(default=default, help=help)

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, ", ".join(map(repr, self.allowed_values)))

    @property
    def allowed_values(self):
        return self._enum._values

    def validate(self, value):
        super(Enum, self).validate(value)

        if not (value is None or value in self._enum):
            raise ValueError("invalid value: %r; allowed values are %s" % (value, nice_join(self.allowed_values)))

    def _sphinx_type(self):
        # try to return a link to a proper enum in bokeh.core.enums if possible
        if self._enum in enums.__dict__.values():
            for name, obj in enums.__dict__.items():
                if self._enum is obj:
                    val = self._sphinx_model_link("%s.%s" % (self._enum.__module__, name))
        else:
            val = str(self._enum)
        return self._sphinx_prop_link() + "( %s )" % val

class Auto(Enum):
    ''' Accepts only the string "auto".

    Useful for properties that can be configured to behave "automatically".

    Example:

        This property is often most useful in conjunction with the
        :class:`~bokeh.core.properties.Either` property.

        .. code-block:: python

            >>> class AutoModel(HasProps):
            ...     prop = Either(Float, Auto)
            ...

            >>> m = AutoModel()

            >>> m.prop = 10.2

            >>> m.prop = "auto"

            >>> m.prop = "foo"      # ValueError !!

            >>> m.prop = [1, 2, 3]  # ValueError !!

    '''
    def __init__(self):
        super(Auto, self).__init__("auto")

    def __str__(self):
        return self.__class__.__name__

    def _sphinx_type(self):
        return self._sphinx_prop_link()

# Properties useful for defining visual attributes
class Color(Either):
    ''' Accept color values in a variety of ways.

    For colors, because we support named colors and hex values prefaced
    with a "#", when we are handed a string value, there is a little
    interpretation: if the value is one of the 147 SVG named colors or
    it starts with a "#", then it is interpreted as a value.

    If a 3-tuple is provided, then it is treated as an RGB (0..255).
    If a 4-tuple is provided, then it is treated as an RGBa (0..255), with
    alpha as a float between 0 and 1.  (This follows the HTML5 Canvas API.)

    Example:

        .. code-block:: python

            >>> class ColorModel(HasProps):
            ...     prop = Color()
            ...

            >>> m = ColorModel()

            >>> m.prop = "firebrick"

            >>> m.prop = "#a240a2"

            >>> m.prop = (100, 100, 255)

            >>> m.prop = (100, 100, 255, 0.5)

            >>> m.prop = "junk"              # ValueError !!

            >>> m.prop = (100.2, 57.3, 10.2) # ValueError !!

    '''

    def __init__(self, default=None, help=None):
        types = (Enum(enums.NamedColor),
                 Regex("^#[0-9a-fA-F]{6}$"),
                 Tuple(Byte, Byte, Byte),
                 Tuple(Byte, Byte, Byte, Percent))
        super(Color, self).__init__(*types, default=default, help=help)

    def __str__(self):
        return self.__class__.__name__

    def transform(self, value):
        if isinstance(value, tuple):
            value = RGB(*value).to_css()
        return value

    def _sphinx_type(self):
        return self._sphinx_prop_link()


class MinMaxBounds(Either):
    ''' Accept (min, max) bounds tuples for use with Ranges.

    Bounds are provided as a tuple of ``(min, max)`` so regardless of whether your range is
    increasing or decreasing, the first item should be the minimum value of the range and the
    second item should be the maximum. Setting min > max will result in a ``ValueError``.

    Setting bounds to None will allow your plot to pan/zoom as far as you want. If you only
    want to constrain one end of the plot, you can set min or max to
    ``None`` e.g. ``DataRange1d(bounds=(None, 12))`` '''

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
        return self._sphinx_prop_link()


class DashPattern(Either):
    ''' Accept line dash specifications.

    Express patterns that describe line dashes.  ``DashPattern`` values
    can be specified in a variety of ways:

    * An enum: "solid", "dashed", "dotted", "dotdash", "dashdot"
    * a tuple or list of integers in the `HTML5 Canvas dash specification style`_.
      Note that if the list of integers has an odd number of elements, then
      it is duplicated, and that duplicated list becomes the new dash list.

    To indicate that dashing is turned off (solid lines), specify the empty
    list [].

    .. _HTML5 Canvas dash specification style: http://www.w3.org/html/wg/drafts/2dcontext/html5_canvas/#dash-list

    '''

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

    def __str__(self):
        return self.__class__.__name__

    def transform(self, value):
        value = super(DashPattern, self).transform(value)

        if isinstance(value, string_types):
            try:
                return self._dash_patterns[value]
            except KeyError:
                return [int(x) for x in  value.split()]
        else:
            return value

    def _sphinx_type(self):
        return self._sphinx_prop_link()

class Size(Float):
    ''' Accept non-negative numeric values.

    Args:
        default (float or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

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

    Example:

        .. code-block:: python

            >>> class SizeModel(HasProps):
            ...     prop = Size()
            ...

            >>> m = SizeModel()

            >>> m.prop = 0

            >>> m.prop = 10e6

            >>> m.prop = -10   # ValueError !!

            >>> m.prop = "foo" # ValueError !!

    '''
    def validate(self, value):
        super(Size, self).validate(value)

        if not (value is None or 0.0 <= value):
            raise ValueError("expected a non-negative number, got %r" % value)

class Percent(Float):
    ''' Accept floating point percentage values.

    ``Percent`` can be useful and semantically meaningful for specifying
    things like alpha values and extents.

    Args:
        default (float or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

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

    Example:

        .. code-block:: python

            >>> class PercentModel(HasProps):
            ...     prop = Percent()
            ...

            >>> m = PercentModel()

            >>> m.prop = 0.0

            >>> m.prop = 0.2

            >>> m.prop = 1.0

            >>> m.prop = -2  # ValueError !!

            >>> m.prop = 5   # ValueError !!

    '''
    def validate(self, value):
        super(Percent, self).validate(value)

        if not (value is None or 0.0 <= value <= 1.0):
            raise ValueError("expected a value in range [0, 1], got %r" % value)

class Angle(Float):
    ''' Accept floating point angle values.

    ``Angle`` is equivalent to :class:`~bokeh.core.properties.Float` but is
    provided for cases when it is more semantically meaningful.

    Args:
        default (float or None, optional) :
            A default value for attributes created from this property to
            have (default: None)

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

    '''
    pass

class Date(Property):
    ''' Accept Date (not datetime) values.

    '''
    def __init__(self, default=datetime.date.today(), help=None):
        super(Date, self).__init__(default=default, help=help)

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

    def validate(self, value):
        super(Date, self).validate(value)

        if not (value is None or isinstance(value, (datetime.date,) + string_types + (float,) + bokeh_integer_types)):
            raise ValueError("expected a date, string or timestamp, got %r" % value)

class Datetime(Property):
    ''' Accept Datetime values.

    '''

    def __init__(self, default=datetime.date.today(), help=None):
        super(Datetime, self).__init__(default=default, help=help)

    def transform(self, value):
        value = super(Datetime, self).transform(value)
        return value
        # Handled by serialization in protocol.py for now

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

class TimeDelta(Property):
    ''' Accept TimeDelta values.

    '''

    def __init__(self, default=datetime.timedelta(), help=None):
        super(TimeDelta, self).__init__(default=default, help=help)

    def transform(self, value):
        value = super(TimeDelta, self).transform(value)
        return value
        # Handled by serialization in protocol.py for now

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

class TitleProp(Either):
    ''' Accept a title value for a plot (possibly transforming a plain string).

    .. note::
        This property exists only to support a deprecation, and will be removed
        in the future once the deprecation is completed.

    '''
    def __init__(self, default=None, help=None):
        types = (Instance('bokeh.models.annotations.Title'), String)
        super(TitleProp, self).__init__(*types, default=default, help=help)

    def transform(self, value):
        if isinstance(value, str):
            from bokeh.models.annotations import Title
            deprecated('''Setting Plot property 'title' using a string was deprecated in 0.12.0,
            and will be removed. The title is now an object on Plot (which holds all of it's
            styling properties). Please use Plot.title.text instead.

            SERVER USERS: If you were using plot.title to have the server update the plot title
            in a callback, you MUST update to plot.title.text as the title object cannot currently
            be replaced after initialization.
            ''')
            value = Title(text=value)
        return value

    def _sphinx_type(self):
        return self._sphinx_prop_link()

#------------------------------------------------------------------------------
# Container properties
#------------------------------------------------------------------------------

class Seq(ContainerProperty):
    ''' Accept non-string ordered sequences of values, e.g. list, tuple, array.

    '''

    def __init__(self, item_type, default=None, help=None):
        self.item_type = self._validate_type_param(item_type)
        super(Seq, self).__init__(default=default, help=help)

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, self.item_type)

    @property
    def type_params(self):
        return [self.item_type]

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, list):
            return self._new_instance([ self.item_type.from_json(item, models) for item in json ])
        else:
            raise DeserializationError("%s expected a list or None, got %s" % (self, json))

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

    def _sphinx_type(self):
        return self._sphinx_prop_link() + "( %s )" % self.item_type._sphinx_type()

class List(Seq):
    ''' Accept Python list values.

    '''

    def __init__(self, item_type, default=[], help=None):
        # todo: refactor to not use mutable objects as default values.
        # Left in place for now because we want to allow None to express
        # optional values. Also in Dict.
        super(List, self).__init__(item_type, default=default, help=help)

    @classmethod
    def _is_seq(cls, value):
        return isinstance(value, list)

class Array(Seq):
    ''' Accept NumPy array values.

    '''

    @classmethod
    def _is_seq(cls, value):
        import numpy as np
        return isinstance(value, np.ndarray)

    def _new_instance(self, value):
        import numpy as np
        return np.array(value)


class Dict(ContainerProperty):
    ''' Accept Python dict values.

    If a default value is passed in, then a shallow copy of it will be
    used for each new use of this property.

    '''

    def __init__(self, keys_type, values_type, default={}, help=None):
        self.keys_type = self._validate_type_param(keys_type)
        self.values_type = self._validate_type_param(values_type)
        super(Dict, self).__init__(default=default, help=help)

    def __str__(self):
        return "%s(%s, %s)" % (self.__class__.__name__, self.keys_type, self.values_type)

    @property
    def type_params(self):
        return [self.keys_type, self.values_type]

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, dict):
            return { self.keys_type.from_json(key, models): self.values_type.from_json(value, models) for key, value in iteritems(json) }
        else:
            raise DeserializationError("%s expected a dict or None, got %s" % (self, json))

    def validate(self, value):
        super(Dict, self).validate(value)

        if value is not None:
            if not (isinstance(value, dict) and \
                    all(self.keys_type.is_valid(key) and self.values_type.is_valid(val) for key, val in iteritems(value))):
                raise ValueError("expected an element of %s, got %r" % (self, value))

    def _sphinx_type(self):
        return self._sphinx_prop_link() + "( %s, %s )" % (self.keys_type._sphinx_type(), self.values_type._sphinx_type())


class ColumnData(Dict):
    ''' Accept a Python dictionary suitable as the ``data`` attribute of a
    :class:`~bokeh.models.sources.ColumnDataSource`.

    This class is a specialization of ``Dict`` that handles efficiently
    encoding columns that are NumPy arrays.

    '''

    def from_json(self, json, models=None):
        ''' Decodes column source data encoded as lists or base64 strings.
        '''
        if json is None:
            return None
        elif not isinstance(json, dict):
            raise DeserializationError("%s expected a dict or None, got %s" % (self, json))
        new_data = {}
        for key, value in json.items():
            key = self.keys_type.from_json(key, models)
            if isinstance(value, dict) and '__ndarray__' in value:
                new_data[key] = decode_base64_dict(value)
            elif isinstance(value, list) and any(isinstance(el, dict) and '__ndarray__' in el for el in value):
                new_list = []
                for el in value:
                    if isinstance(el, dict) and '__ndarray__' in el:
                        el = decode_base64_dict(el)
                    elif isinstance(el, list):
                        el = self.values_type.from_json(el)
                    new_list.append(el)
                new_data[key] = new_list
            else:
                new_data[key] = self.values_type.from_json(value, models)
        return new_data


    def serialize_value(self, value):
        return transform_column_source_data(value)

class Tuple(ContainerProperty):
    ''' Accept Python tuple values.

    '''
    def __init__(self, tp1, tp2, *type_params, **kwargs):
        self._type_params = list(map(self._validate_type_param, (tp1, tp2) + type_params))
        super(Tuple, self).__init__(default=kwargs.get("default"), help=kwargs.get("help"))

    def __str__(self):
        return "%s(%s)" % (self.__class__.__name__, ", ".join(map(str, self.type_params)))

    @property
    def type_params(self):
        return self._type_params

    def from_json(self, json, models=None):
        if json is None:
            return None
        elif isinstance(json, list):
            return tuple(type_param.from_json(item, models) for type_param, item in zip(self.type_params, json))
        else:
            raise DeserializationError("%s expected a list or None, got %s" % (self, json))

    def validate(self, value):
        super(Tuple, self).validate(value)

        if value is not None:
            if not (isinstance(value, (tuple, list)) and len(self.type_params) == len(value) and \
                    all(type_param.is_valid(item) for type_param, item in zip(self.type_params, value))):
                raise ValueError("expected an element of %s, got %r" % (self, value))

    def _sphinx_type(self):
        return self._sphinx_prop_link() + "( %s )" % ", ".join(x._sphinx_type() for x in self.type_params)

class RelativeDelta(Dict):
    ''' Accept RelativeDelta dicts for time delta values.

    '''

    def __init__(self, default={}, help=None):
        keys = Enum("years", "months", "days", "hours", "minutes", "seconds", "microseconds")
        values = Int
        super(RelativeDelta, self).__init__(keys, values, default=default, help=help)

    def __str__(self):
        return self.__class__.__name__

#------------------------------------------------------------------------------
# DataSpec properties
#------------------------------------------------------------------------------

class DataSpec(Either):
    ''' Base class for properties that accept either a fixed value, or a
    string name that references a column in a
    :class:`~bokeh.models.sources.ColumnDataSource`.

    Many Bokeh models have properties that a user might want to set either
    to a single fixed value, or to have the property take values from some
    column in a data source. As a concrete example consider a glyph with
    an ``x`` property for location. We might want to set all the glyphs
    that get drawn to have the same location, say ``x=10``. It would be
    convenient to  just be able to write:

    .. code-block:: python

        glyph.x = 10

    Alternatively, maybe the each glyph that gets drawn should have a
    different location, according to the "pressure" column of a data
    source. In this case we would like to be able to write:

    .. code-block:: python

        glyph.x = "pressure"

    Bokeh ``DataSpec`` properties (and subclasses) afford this ease of
    and consistency of expression. Ultimately, all ``DataSpec`` properties
    resolve to dictionary values, with either a ``"value"`` key, or a
    ``"field"`` key, depending on how it is set.

    For instance:

    .. code-block:: python

        glyph.x = 10          # => { 'value': 10 }

        glyph.x = "pressure"  # => { 'field': 'pressure' }

    When these underlying dictionary dictionary values are received in
    the browser, BokehJS knows how to interpret them and take the correct,
    expected action (i.e., draw the glyph at ``x=10``, or draw the glyph
    with ``x`` coordinates from the "pressure" column). In this way, both
    use-cases may be expressed easily in python, without having to handle
    anything differently, from the user perspective.

    It is worth noting that ``DataSpec`` properties can also be set directly
    with properly formed dictionary values:

    .. code-block:: python

        glyph.x = { 'value': 10 }         # same as glyph.x = 10

        glyph.x = { 'field': 'pressure' } # same as glyph.x = "pressure"

    Setting the property directly as a dict can be useful in certain
    situations. For instance some ``DataSpec`` subclasses also add a
    ``"units"`` key to the dictionary. This key is often set automatically,
    but the dictionary format provides a direct mechanism to override as
    necessary. Additionally, ``DataSpec`` can have a ``"transform"`` key,
    that specifies a client-side transform that should be applied to any
    fixed or field values before they are uses. As an example, you might want
    to apply a ``Jitter`` transform to the ``x`` values:

    .. code-block:: python

        glyph.x = { 'value': 10, 'transform': Jitter(width=0.4) }

    Note that ``DataSpec`` is not normally useful on its own. Typically,
    a model will define properties using one of the sublclasses such
    as :class:`~bokeh.core.properties.NumberSpec` or
    :class:`~bokeh.core.properties.ColorSpec`. For example, a Bokeh
    model with ``x``, ``y`` and ``color`` properties that can handle
    fixed values or columns automatically might look like:

    .. code-block:: python

        class SomeModel(Model):

            x = NumberSpec(default=0, help="docs for x")

            y = NumberSpec(default=0, help="docs for y")

            color = ColorSpec(help="docs for color") # defaults to None

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

    def make_descriptors(self, base_name):
        ''' Return a list of ``DataSpecPropertyDescriptor`` instances to
        install on a class, in order to delegate attribute access to this
        property.

        Args:
            name (str) : the name of the property these descriptors are for

        Returns:
            list[DataSpecPropertyDescriptor]

        The descriptors returned are collected by the ``MetaHasProps``
        metaclass and added to ``HasProps`` subclasses during class creation.
        '''
        return [ DataSpecPropertyDescriptor(base_name, self) ]

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
        return self._sphinx_prop_link()

class NumberSpec(DataSpec):
    ''' A |DataSpec| property that accepts numeric fixed values.

    .. code-block:: python

        m.location = 10.3  # value

        m.location = "foo" # field

    '''
    def __init__(self, default=None, help=None):
        super(NumberSpec, self).__init__(Float, default=default, help=help)

class StringSpec(DataSpec):
    ''' A |DataSpec| property that accepts string fixed values.

    Because acceptable fixed values and field names are both strings, it can
    be necessary explicitly to disambiguate these possibilities. By default,
    string values are interpreted as fields, but the |value| function can be
    used to specify that a string should interpreted as a value:

    .. code-block:: python

        m.title = value("foo") # value

        m.title = "foo"        # field

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
    ''' A |DataSpec| property that accepts font-size fixed values.

    The ``FontSizeSpec`` property attempts to first interpret string values as
    font sizes (i.e. valid CSS length values). Otherwise string values are
    interpreted as field names. For example:

    .. code-block:: python

        m.font_size = "10pt"  # value

        m.font_size = "1.5em" # value

        m.font_size = "foo"   # field

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

class UnitsSpec(NumberSpec):
    ''' A |DataSpec| property that accepts numeric fixed values, and also
    provides an associated units property to store units information.

    '''
    def __init__(self, default, units_type, units_default, help=None):
        super(UnitsSpec, self).__init__(default=default, help=help)
        self._units_type = self._validate_type_param(units_type)
        # this is a hack because we already constructed units_type
        self._units_type.validate(units_default)
        self._units_type._default = units_default
        # this is sort of a hack because we don't have a
        # serialized= kwarg on every Property subtype
        self._units_type._serialized = False

    def __str__(self):
        return "%s(units_default=%r)" % (self.__class__.__name__, self._units_type._default)

    def make_descriptors(self, base_name):
        ''' Return a list of ``PropertyDescriptor`` instances to install on a
        class, in order to delegate attribute access to this property.

        Unlike simpler property types, ``UnitsSpec`` returns multiple
        descriptors to install. In particular, descriptors for the base
        property as well as the associated units property are returned.

        Args:
            name (str) : the name of the property these descriptors are for

        Returns:
            list[PropertyDescriptor]

        The descriptors returned are collected by the ``MetaHasProps``
        metaclass and added to ``HasProps`` subclasses during class creation.
        '''
        units_name = base_name + "_units"
        units_props = self._units_type.make_descriptors(units_name)
        return units_props + [ UnitsSpecPropertyDescriptor(base_name, self, units_props[0]) ]

    def to_serializable(self, obj, name, val):
        d = super(UnitsSpec, self).to_serializable(obj, name, val)
        if d is not None and 'units' not in d:
            # d is a PropertyValueDict at this point, we need to convert it to
            # a plain dict if we are going to modify its value, otherwise a
            # notify_change that should not happen will be triggered
            d = dict(d)
            d["units"] = getattr(obj, name+"_units")
        return d

class AngleSpec(UnitsSpec):
    ''' A |DataSpec| property that accepts numeric fixed values, and also
    provides an associated units property to store angle units.

    Acceptable values for units are ``"rad"`` and ``"deg"``.

    '''
    def __init__(self, default=None, units_default="rad", help=None):
        super(AngleSpec, self).__init__(default=default, units_type=Enum(enums.AngleUnits), units_default=units_default, help=help)

class DistanceSpec(UnitsSpec):
    ''' A |DataSpec| property that accepts numeric fixed values or strings
    that refer to columns in a :class:`~bokeh.models.sources.ColumnDataSource`,
    and also provides an associated units property to store units information.
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
    ''' A |DataSpec| property that accepts numeric fixed values for screen
    distances, and also provides an associated units property that reports
    ``"screen"`` as the units.

    .. note::
        Units are always ``"screen"``.

    '''
    def prepare_value(self, cls, name, value):
        try:
            if value is not None and value < 0:
                raise ValueError("Distances must be positive or None!")
        except TypeError:
            pass
        return super(ScreenDistanceSpec, self).prepare_value(cls, name, value)

    def to_serializable(self, obj, name, val):
        d = super(ScreenDistanceSpec, self).to_serializable(obj, name, val)
        d["units"] = "screen"
        return d

class DataDistanceSpec(NumberSpec):
    ''' A |DataSpec| property that accepts numeric fixed values for data-space
    distances, and also provides an associated units property that reports
    ``"data"`` as the units.

    .. note::
        Units are always ``"data"``.

    '''
    def prepare_value(self, cls, name, value):
        try:
            if value is not None and value < 0:
                raise ValueError("Distances must be positive or None!")
        except TypeError:
            pass
        return super(DataDistanceSpec, self).prepare_value(cls, name, value)

    def to_serializable(self, obj, name, val):
        d = super(ScreenDistanceSpec, self).to_serializable(obj, name, val)
        d["units"] = "data"
        return d

class ColorSpec(DataSpec):
    ''' A |DataSpec| property that accepts |Color| fixed values.

    The ``ColorSpec`` property attempts to first interpret string values as
    colors. Otherwise, string values are interpreted as field names. For
    example:

    .. code-block:: python

        m.color = "#a4225f"   # value (hex color string)

        m.color = "firebrick" # value (named CSS color string)

        m.color = "foo"       # field (named "foo")

    This automatic interpretation can be override using the dict format
    directly, or by using the |field| function:

    .. code-block:: python

        m.color = { "field": "firebrick" } # field (named "firebrick")

        m.color = field("firebrick")       # field (named "firebrick")

    '''
    def __init__(self, default, help=None):
        super(ColorSpec, self).__init__(Color, default=default, help=help)

    @classmethod
    def isconst(cls, val):
        ''' Whether the value is a string color literal.

        Checks for a well-formed hexadecimal color value or a named color.

        Args:
            val (str) : the value to check

        Returns:
            True, if the value is a string color literal

        '''
        return isinstance(val, string_types) and \
               ((len(val) == 7 and val[0] == "#") or val in enums.NamedColor)

    def to_serializable(self, obj, name, val):
        if val is None:
            return dict(value=None)

        # Check for hexadecimal or named color
        if self.isconst(val):
            return dict(value=val)

        # Check for RGB or RGBa tuple
        if isinstance(val, tuple):
            return dict(value=RGB(*val).to_css())

        # Check for data source field name
        if isinstance(val, string_types):
            return dict(field=val)

        # Must be dict, return as-is
        return val

    def prepare_value(self, cls, name, value):
        # Some explanation is in order. We want to accept tuples like
        # (12.0, 100.0, 52.0) i.e. that have "float" byte values. The
        # ColorSpec has a transform to adapt values like this to tuples
        # of integers, but Property validation happens before the
        # transform step, so values like that will fail Color validation
        # at this point, since Color is very strict about only accepting
        # tuples of (integer) bytes. This conditions tuple values to only
        # have integer RGB components
        if isinstance(value, tuple):
            # TODO (bev) verify that all original floats are integer values?
            value = tuple(int(v) if i < 3 else v for i, v in enumerate(value))
        return super(ColorSpec, self).prepare_value(cls, name, value)

#------------------------------------------------------------------------------
# DataSpec helpers
#------------------------------------------------------------------------------

def field(name):
    ''' Convenience function to explicitly return a "field" specification for
    a Bokeh :class:`~bokeh.core.properties.DataSpec` property.

    Args:
        name (str) : name of a data source field to reference for a
            ``DataSpec`` property.

    Returns:
        dict : ``{ "field": name }``

    .. note::
        This function is included for completeness. String values for
        property specifications are by default interpreted as field names.

    '''
    return dict(field=name)

def value(val):
    ''' Convenience function to explicitly return a "value" specification for
    a Bokeh :class:`~bokeh.core.properties.DataSpec` property.

    Args:
        val (any) : a fixed value to specify for a ``DataSpec`` property.

    Returns:
        dict : ``{ "value": name }``

    .. note::
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

#------------------------------------------------------------------------------
# Special Properties
#------------------------------------------------------------------------------

# intentional transitive import to put Override in this module, DO NOT REMOVE
from .property.override import Override ; Override

class Include(PropertyDescriptorFactory):
    ''' Include "mix-in" property collection in a Bokeh model.

    See :ref:`bokeh.core.property_mixins` for more details.

    '''

    def __init__(self, delegate, help="", use_prefix=True):
        from .has_props import HasProps
        if not (isinstance(delegate, type) and issubclass(delegate, HasProps)):
            raise ValueError("expected a subclass of HasProps, got %r" % delegate)

        self.delegate = delegate
        self.help = help
        self.use_prefix = use_prefix

    def make_descriptors(self, base_name):
        descriptors = []
        delegate = self.delegate
        if self.use_prefix:
            prefix = re.sub("_props$", "", base_name) + "_"
        else:
            prefix = ""

        # it would be better if we kept the original generators from
        # the delegate and built our Include props from those, perhaps.
        for subpropname in delegate.properties(with_bases=False):
            fullpropname = prefix + subpropname
            subprop_descriptor = delegate.lookup(subpropname)
            if isinstance(subprop_descriptor, BasicPropertyDescriptor):
                prop = copy(subprop_descriptor.property)
                if "%s" in self.help:
                    doc = self.help % subpropname.replace('_', ' ')
                else:
                    doc = self.help
                prop.__doc__ = doc
                descriptors += prop.make_descriptors(fullpropname)

        return descriptors


# Everything below is just to update the module docstring
_all_props = set(x for x in globals().values() if isinstance(x, type) and issubclass(x, Property))
_all_props.remove(Property)
_all_props.remove(PrimitiveProperty)
_all_props.remove(ParameterizedProperty)
_all_props.remove(ContainerProperty)
def _find_and_remove(typ):
    global _all_props
    sub = set(x for x in _all_props if issubclass(x, typ))
    _all_props -= sub
    return sub
_data_specs = "\n".join(sorted(".. autoclass:: %s" % x.__name__ for x in _find_and_remove(DataSpec)))
_containers = "\n".join(sorted(".. autoclass:: %s" % x.__name__ for x in _find_and_remove(ContainerProperty)))
_basic = "\n".join(sorted(".. autoclass:: %s" % x.__name__ for x in _all_props))

__doc__ = __doc__ % (_basic, _containers, _data_specs)

del _all_props, _data_specs, _containers, _basic, _find_and_remove
