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

{basic_properties}

Container Properties
--------------------

DataSpec Properties
-------------------

{dataspec_properties}

Helpers
~~~~~~~

.. autofunction:: field
.. autofunction:: value

Special Properties
------------------

.. autoclass:: Include
.. autoclass:: Override

Validation Control
------------------

By default, Bokeh properties perform type validation on values. This helps to
ensure the consistency of any data exchanged between Python and JavaScript, as
well as provide detailed and immediate feedback to users if they attempt to
set values of the wrong type. However, these type checks incur some overhead.
In some cases it may be desirable to turn off validation in specific places,
or even entirely, in order to boost performance. The following API is available
to control when type validation occurs.

.. autoclass:: validate
.. autofunction:: without_property_validation

'''
from __future__ import absolute_import, print_function

import logging
logger = logging.getLogger(__name__)

import base64
from functools import wraps
from io import BytesIO
import re

import PIL.Image
from six import string_types

from .. import colors
from ..util.serialization import convert_datetime_type, convert_timedelta_type
from ..util.string import nice_join, format_docstring

from .property.bases import ParameterizedProperty, Property
from .property.descriptors import DataSpecPropertyDescriptor, UnitsSpecPropertyDescriptor
from .property.instance import Instance
from . import enums


from .property.any import Any; Any
from .property.any import AnyRef; AnyRef

from .property.datetime import Date; Date
from .property.datetime import Datetime; Datetime
from .property.datetime import TimeDelta; TimeDelta

from .property.either import Either; Either

from .property.numeric import Angle; Angle
from .property.numeric import Byte; Byte
from .property.numeric import Interval; Interval
from .property.numeric import Percent; Percent
from .property.numeric import Size; Size

from .property.primitive import Bool; Bool
from .property.primitive import Complex; Complex
from .property.primitive import Int; Int
from .property.primitive import Float; Float
from .property.primitive import String; String

class FontSize(String):

    _font_size_re = re.compile(r"^[0-9]+(.[0-9]+)?(%|em|ex|ch|ic|rem|vw|vh|vi|vb|vmin|vmax|cm|mm|q|in|pc|pt|px)$", re.I)

    def validate(self, value, detail=True):
        super(FontSize, self).validate(value, detail)

        if isinstance(value, string_types):
            if len(value) == 0:
                msg = "" if not detail else "empty string is not a valid font size value"
                raise ValueError(msg)
            elif self._font_size_re.match(value) is None:
                msg = "" if not detail else "%r is not a valid font size value" % value
                raise ValueError(msg)

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

    def validate(self, value, detail=True):
        super(Regex, self).validate(value, detail)

        if not (value is None or self.regex.match(value) is not None):
            msg = "" if not detail else "expected a string matching %r pattern, got %r" % (self.regex.pattern, value)
            raise ValueError(msg)

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
    def validate(self, value, detail=True):
        super(JSON, self).validate(value, detail)

        if value is None: return

        try:
            import json
            json.loads(value)
        except ValueError:
            msg = "" if not detail else "expected JSON text, got %r" % value
            raise ValueError(msg)

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

    def validate(self, value, detail=True):
        super(Enum, self).validate(value, detail)

        if not (value is None or value in self._enum):
            msg = "" if not detail else "invalid value: %r; allowed values are %s" % (value, nice_join(self.allowed_values))
            raise ValueError(msg)

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

class MarkerType(Enum):
    '''

    '''
    def __init__(self, **kw):
        super(MarkerType, self).__init__(enums.MarkerType, **kw)

class Image(Property):
    ''' Accept image file types, e.g PNG, JPEG, TIFF, etc.

    This property can be configured with:

    * A string filename to be loaded with ``PIL.Image.open``
    * An RGB(A) NumPy array, will be converted to PNG
    * A ``PIL.Image.Image`` object

    In all cases, the image data is serialized as a Base64 encoded string.

    '''

    def validate(self, value, detail=True):
        import numpy as np

        valid = False

        if value is None or isinstance(value, (string_types, PIL.Image.Image)):
            valid = True

        if isinstance(value, np.ndarray):
            valid = value.dtype == "uint8" and len(value.shape) == 3 and value.shape[2] in (3, 4)

        if not valid:
            msg = "" if not detail else "invalid value: %r; allowed values are string filenames, PIL.Image.Image instances, or RGB(A) NumPy arrays" % value
            raise ValueError(msg)

    def transform(self, value):
        if value is None:
            return None

        import numpy as np
        if isinstance(value, np.ndarray):
            value = PIL.Image.fromarray(value)

        if isinstance(value, string_types):
            value = PIL.Image.open(value)

        if isinstance(value, PIL.Image.Image):
            out = BytesIO()
            fmt = value.format or "PNG"
            value.save(out, fmt)
            return "data:image/%s;base64," % fmt.lower() + base64.b64encode(out.getvalue()).decode('ascii')

        raise ValueError("Could not transform %r" % value)

class RGB(Property):
    ''' Accept colors.RGB values.

    '''

    def validate(self, value, detail=True):
        super(RGB, self).validate(value, detail)

        if not (value is None or isinstance(value, colors.RGB)):
            msg = "" if not detail else "expected RGB value, got %r" % (value,)
            raise ValueError(msg)

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
                 Tuple(Byte, Byte, Byte, Percent),
                 RGB)
        super(Color, self).__init__(*types, default=default, help=help)

    def __str__(self):
        return self.__class__.__name__

    def transform(self, value):
        if isinstance(value, tuple):
            value = colors.RGB(*value).to_css()
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
                Tuple(TimeDelta, TimeDelta),
                Tuple(Datetime, Datetime),
            )
        else:
            types = (
                Auto,
                Tuple(Float, Float),
                Tuple(TimeDelta, TimeDelta),
            )
        super(MinMaxBounds, self).__init__(*types, default=default, help=help)

    def validate(self, value, detail=True):
        super(MinMaxBounds, self).validate(value, detail)

        if value is None:
            pass

        elif value[0] is None or value[1] is None:
            pass

        elif value[0] >= value[1]:
            msg = "" if not detail else "Invalid bounds: maximum smaller than minimum. Correct usage: bounds=(min, max)"
            raise ValueError(msg)

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

#------------------------------------------------------------------------------
# Container properties
#------------------------------------------------------------------------------

from .property.container import Array; Array
from .property.container import ColumnData; ColumnData
from .property.container import Dict; Dict
from .property.container import List; List
from .property.container import Seq; Seq
from .property.container import Tuple; Tuple
from .property.container import RelativeDelta; RelativeDelta

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
    def __init__(self, key_type, value_type, default, help=None):
        super(DataSpec, self).__init__(
            String,
            Dict(
                key_type,
                Either(
                    String,
                    Instance('bokeh.models.transforms.Transform'),
                    Instance('bokeh.models.expressions.Expression'),
                    value_type)),
            value_type,
            default=default,
            help=help
        )
        self._type = self._validate_type_param(value_type)

    # TODO (bev) add stricter validation on keys

    def make_descriptors(self, base_name):
        ''' Return a list of ``DataSpecPropertyDescriptor`` instances to
        install on a class, in order to delegate attribute access to this
        property.

        Args:
            base_name (str) : the name of the property these descriptors are for

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
            self._type.validate(val, False)
            return dict(value=val)
        except ValueError:
            pass

        # Check for data source field name
        if isinstance(val, string_types):
            return dict(field=val)

        # Must be dict, return a new dict
        return dict(val)

    def _sphinx_type(self):
        return self._sphinx_prop_link()

_ExprFieldValueTransform = Enum("expr", "field", "value", "transform")

class NumberSpec(DataSpec):
    ''' A |DataSpec| property that accepts numeric and datetime fixed values.

    By default, date and datetime values are immediately converted to
    milliseconds since epoch. It is possible to disable processing of datetime
    values by passing ``accept_datetime=False``.

    By default, timedelta values are immediately converted to absolute
    milliseconds.  It is possible to disable processing of timedelta
    values by passing ``accept_timedelta=False``

    Timedelta values are interpreted as absolute milliseconds.

    .. code-block:: python

        m.location = 10.3  # value

        m.location = "foo" # field

    '''
    def __init__(self, default=None, help=None, key_type=_ExprFieldValueTransform, accept_datetime=True, accept_timedelta=True):
        super(NumberSpec, self).__init__(key_type, Float, default=default, help=help)
        if accept_timedelta:
            self.accepts(TimeDelta, convert_timedelta_type)
        if accept_datetime:
            self.accepts(Datetime, convert_datetime_type)


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
    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform):
        super(StringSpec, self).__init__(key_type, List(String), default=default, help=help)

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

    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform):
        super(FontSizeSpec, self).__init__(key_type, FontSize, default=default, help=help)

    def validate(self, value, detail=True):
        # We want to preserve existing semantics and be a little more restrictive. This
        # validations makes m.font_size = "" or m.font_size = "6" an error
        super(FontSizeSpec, self).validate(value, detail)
        if isinstance(value, string_types):
            if len(value) == 0 or value[0].isdigit() and FontSize._font_size_re.match(value) is None:
                msg = "" if not detail else "%r is not a valid font size value" % value
                raise ValueError(msg)

class MarkerSpec(DataSpec):
    ''' A |DataSpec| property that accepts marker types as fixed values.

    The ``MarkerSpec`` property attempts to first interpret string values as
    marker types. Otherwise string values are interpreted as field names.
    For example:

    .. code-block:: python

        m.font_size = "circle" # value

        m.font_size = "square" # value

        m.font_size = "foo"    # field

    '''

    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform):
        super(MarkerSpec, self).__init__(key_type, MarkerType, default=default, help=help)


_ExprFieldValueTransformUnits = Enum("expr", "field", "value", "transform", "units")

class UnitsSpec(NumberSpec):
    ''' A |DataSpec| property that accepts numeric fixed values, and also
    provides an associated units property to store units information.

    '''
    def __init__(self, default, units_type, units_default, help=None):
        super(UnitsSpec, self).__init__(default=default, help=help, key_type=_ExprFieldValueTransformUnits)
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

class ScreenDistanceSpec(UnitsSpec):
    ''' A |DataSpec| property that accepts numeric fixed values for screen
    distances, and also provides an associated units property that reports
    ``"screen"`` as the units.

    .. note::
        Units are always ``"screen"``.

    '''

    def __init__(self, default=None, help=None):
        super(ScreenDistanceSpec, self).__init__(default=default, units_type=Enum(enums.enumeration("screen")), units_default="screen", help=help)

    def prepare_value(self, cls, name, value):
        try:
            if value is not None and value < 0:
                raise ValueError("Distances must be positive or None!")
        except TypeError:
            pass
        return super(ScreenDistanceSpec, self).prepare_value(cls, name, value)

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
        units_props = self._units_type.make_descriptors("unused")
        return [ UnitsSpecPropertyDescriptor(base_name, self, units_props[0]) ]

    def to_serializable(self, obj, name, val):
        d = super(UnitsSpec, self).to_serializable(obj, name, val)
        if d is not None and 'units' not in d:
            # d is a PropertyValueDict at this point, we need to convert it to
            # a plain dict if we are going to modify its value, otherwise a
            # notify_change that should not happen will be triggered
            d = dict(d)
            d["units"] = "screen"
        return d


class DataDistanceSpec(UnitsSpec):
    ''' A |DataSpec| property that accepts numeric fixed values for data-space
    distances, and also provides an associated units property that reports
    ``"data"`` as the units.

    .. note::
        Units are always ``"data"``.

    '''
    def __init__(self, default=None, help=None):
        super(DataDistanceSpec, self).__init__(default=default, units_type=Enum(enums.enumeration("data")), units_default="data", help=help)

    def prepare_value(self, cls, name, value):
        try:
            if value is not None and value < 0:
                raise ValueError("Distances must be positive or None!")
        except TypeError:
            pass
        return super(DataDistanceSpec, self).prepare_value(cls, name, value)

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
        units_props = self._units_type.make_descriptors("unused")
        return [ UnitsSpecPropertyDescriptor(base_name, self, units_props[0]) ]

    def to_serializable(self, obj, name, val):
        d = super(UnitsSpec, self).to_serializable(obj, name, val)
        if d is not None and 'units' not in d:
            # d is a PropertyValueDict at this point, we need to convert it to
            # a plain dict if we are going to modify its value, otherwise a
            # notify_change that should not happen will be triggered
            d = dict(d)
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
    def __init__(self, default, help=None, key_type=_ExprFieldValueTransform):
        super(ColorSpec, self).__init__(key_type, Color, default=default, help=help)

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
            return dict(value=colors.RGB(*val).to_css())

        # Check for data source field name
        if isinstance(val, colors.RGB):
            return val.to_css()

        # Check for data source field name or rgb(a) string
        if isinstance(val, string_types):
            if val.startswith(("rgb(", "rgba(")):
                return val

            return dict(field=val)

        # Must be dict, return new dict
        return dict(val)

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

def expr(expression, transform=None):
    ''' Convenience function to explicitly return an "expr" specification for
    a Bokeh :class:`~bokeh.core.properties.DataSpec` property.

    Args:
        expression (Expression) : a computed expression for a
            ``DataSpec`` property.

        transform (Transform, optional) : a transform to apply (default: None)

    Returns:
        dict : ``{ "expr": expression }``

    .. note::
        This function is included for completeness. String values for
        property specifications are by default interpreted as field names.

    '''
    if transform:
        return dict(expr=expression, transform=transform)
    return dict(expr=expression)


def field(name, transform=None):
    ''' Convenience function to explicitly return a "field" specification for
    a Bokeh :class:`~bokeh.core.properties.DataSpec` property.

    Args:
        name (str) : name of a data source field to reference for a
            ``DataSpec`` property.

        transform (Transform, optional) : a transform to apply (default: None)

    Returns:
        dict : ``{ "field": name }``

    .. note::
        This function is included for completeness. String values for
        property specifications are by default interpreted as field names.

    '''
    if transform:
        return dict(field=name, transform=transform)
    return dict(field=name)

def value(val, transform=None):
    ''' Convenience function to explicitly return a "value" specification for
    a Bokeh :class:`~bokeh.core.properties.DataSpec` property.

    Args:
        val (any) : a fixed value to specify for a ``DataSpec`` property.

        transform (Transform, optional) : a transform to apply (default: None)

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
    if transform:
        return dict(value=val, transform=transform)
    return dict(value=val)

#------------------------------------------------------------------------------
# Special Properties
#------------------------------------------------------------------------------

# intentional transitive imports, DO NOT REMOVE
from .property.include import Include ; Include
from .property.override import Override ; Override

#------------------------------------------------------------------------------
# Validation Control
#------------------------------------------------------------------------------

class validate(object):
    ''' Control validation of bokeh properties

    This can be used as a context manager, or as a normal callable

    Args:
        value (bool) : Whether validation should occur or not

    Example:
        .. code-block:: python

            with validate(False):  # do no validate while within this block
                pass

            validate(False)  # don't validate ever

    See Also:
        :func:`~bokeh.core.property.bases.validation_on`: check the state of validation

        :func:`~bokeh.core.properties.without_property_validation`: function decorator

    '''
    def __init__(self, value):
        self.old = Property._should_validate
        Property._should_validate = value

    def __enter__(self):
        pass

    def __exit__(self, typ, value, traceback):
        Property._should_validate = self.old


def without_property_validation(input_function):
    ''' Turn off property validation during update callbacks

    Example:
        .. code-block:: python

            @without_property_validation
            def update(attr, old, new):
                # do things without validation

    See Also:
        :class:`~bokeh.core.properties.validate`: context mangager for more fine-grained control

    '''
    @wraps(input_function)
    def func(*args, **kwargs):
        with validate(False):
            return input_function(*args, **kwargs)
    return func

# Everything below is just to update the module docstring
_all_props = set(x for x in globals().values() if isinstance(x, type) and issubclass(x, Property))
_all_props.remove(Property)
_all_props.remove(ParameterizedProperty)
def _find_and_remove(typ):
    global _all_props
    sub = set(x for x in _all_props if issubclass(x, typ))
    _all_props -= sub
    return sub
_data_specs = "\n".join(sorted(".. autoclass:: %s" % x.__name__ for x in _find_and_remove(DataSpec)))
_basic = "\n".join(sorted(".. autoclass:: %s" % x.__name__ for x in _all_props))

__doc__ = format_docstring(__doc__, basic_properties=_basic, dataspec_properties=_data_specs)

del _all_props, _data_specs, _basic, _find_and_remove
