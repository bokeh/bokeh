
import inspect

from .properties import (BaseProperty, HasProps, Instance, Enum, Float, Int,
        Color, Percent, Size, Bool, Pattern, Align, Angle, String, FillProps,
        LineProps, TextProps)

from .objects import PlotObject, Viewable

# Size is a way to preserve a data-space-related metric all the way until
#   render time, when the screen dimensions are known
# Align may be "center", "min", "max", or "jitter(func)" where func is name
#   of a random distribution to draw random samples from. Defaults to uniform
#   but gaussian could certainly be useful.

class DataSpec(BaseProperty):
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
    -----------------

    class Foo(HasProps):
        x = DataSpec("x", units="data")

    f = Foo()
    f.x = "fieldname"  # Use the datasource field named "fieldname"
    f.x = 12           # A fixed value of 12
    f.x = ("foo", 16)  # a field name, and a default value

    # Can provide a dict with the fields explicitly named
    f.width = {"name": "foo", "default": 16}
    f.size = {"name": "foo", "units": "screen", "default": 16}

    Reading DataSpecs
    -----------------

    In the cases when the dataspec is set to just a field name or a
    fixed value, then those are returned.  If the user has overridden
    the default value in the DataSpec with a new default value, or
    if no values have been set, then the value of to_dict() is returned.

    In all cases, to determine the full dict that will be used to
    represent this dataspec, use the to_dict() method.

    Implementation
    --------------

    The DataSpec instance is stored in the class dict, and acts as a
    descriptor.  Thus, it is shared between all instances of the class.
    Instance-specific data is stored in the instance dict, in a private
    variable named _[attrname].  This stores the actual value that the
    user last set (and does not exist if the user has not yet set the
    value).

    """
    # TODO: Check to see if the "units" field hasn't been removed...

    def __init__(self, field=None, units="data", default=None):
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
        attrname = "_" + self.name
        if hasattr(obj, attrname):
            setval = getattr(obj, attrname)
            if isinstance(setval, basestring) and self.default is None:
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
        attrname = "_" + self.name
        if isinstance(arg, tuple):
            field, default = arg
            if not isinstance(field, basestring):
                raise RuntimeError("String is required for field name when assigning tuple to a DataSpec")
            setattr(obj, attrname, {"field": field, "default": default})
        else:
            setattr(obj, attrname, arg)

    def __delete__(self, obj):
        if hasattr(obj, self.name + "_dict"):
            delattr(obj, self.name + "_dict")
        BaseProperty.__delete__(self, obj)

    def to_dict(self, obj):
        # Build the complete dict
        setval = getattr(obj, "_"+self.name, None)
        if isinstance(setval, basestring):
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
    and indicating a field name to look for on the datasource:

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

    NAMEDCOLORS = {'indigo', 'gold', 'firebrick', 'indianred', 'yellow',
    'darkolivegreen', 'darkseagreen', 'darkslategrey', 'mediumvioletred',
    'mediumorchid', 'chartreuse', 'mediumblue', 'black', 'springgreen',
    'orange', 'lightsalmon', 'brown', 'turquoise', 'olivedrab', 'cyan',
    'silver', 'skyblue', 'gray', 'darkturquoise', 'goldenrod', 'darkgreen',
    'darkviolet', 'darkgray', 'lightpink', 'teal', 'darkmagenta',
    'lightgoldenrodyellow', 'lavender', 'yellowgreen', 'thistle', 'violet',
    'navy', 'dimgrey', 'orchid', 'blue', 'ghostwhite', 'honeydew',
    'cornflowerblue', 'purple', 'darkkhaki', 'mediumpurple', 'cornsilk', 'red',
    'bisque', 'slategray', 'darkcyan', 'khaki', 'wheat', 'deepskyblue',
    'darkred', 'steelblue', 'aliceblue', 'lightslategrey', 'gainsboro',
    'mediumturquoise', 'floralwhite', 'coral', 'aqua', 'burlywood',
    'darksalmon', 'beige', 'azure', 'lightsteelblue', 'oldlace', 'greenyellow',
    'royalblue', 'lightseagreen', 'mistyrose', 'sienna', 'lightcoral',
    'orangered', 'navajowhite', 'lime', 'palegreen', 'lightcyan', 'seashell',
    'mediumspringgreen', 'fuchsia', 'papayawhip', 'blanchedalmond', 'peru',
    'aquamarine', 'white', 'darkslategray', 'ivory', 'darkgoldenrod',
    'lawngreen', 'lightgreen', 'crimson', 'forestgreen', 'maroon', 'olive',
    'mintcream', 'antiquewhite', 'dimgray', 'hotpink', 'moccasin', 'limegreen',
    'saddlebrown', 'grey', 'darkslateblue', 'lightskyblue', 'deeppink',
    'plum', 'lightgrey', 'dodgerblue', 'slateblue', 'sandybrown', 'magenta',
    'tan', 'rosybrown', 'pink', 'lightblue', 'palevioletred', 'mediumseagreen',
    'linen', 'darkorange', 'powderblue', 'seagreen', 'snow', 'mediumslateblue',
    'midnightblue', 'paleturquoise', 'palegoldenrod', 'whitesmoke',
    'darkorchid', 'salmon', 'lightslategray', 'lemonchiffon', 'chocolate',
    'tomato', 'cadetblue', 'lightyellow', 'lavenderblush', 'darkblue',
    'mediumaquamarine', 'green', 'blueviolet', 'peachpuff', 'darkgrey'}


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
            if self._isconst(field_or_value):
                self.value = field_or_value
            else:
                self.field = field_or_value

    def _isconst(self, arg):
        """ Returns True if the argument is a literal color.  Check for a
        well-formed hexadecimal color value.
        """
        return isinstance(arg, basestring) and \
               ((len(arg) == 7 and arg[0] == "#") or arg in self.NAMEDCOLORS)

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
        attrname = "_" + self.name
        if hasattr(obj, attrname):
            setval = getattr(obj, attrname)
            if self._isconst(setval) or isinstance(setval, tuple):
                # Fixed color value
                return setval
            elif isinstance(setval, basestring):
                if self.default is None:
                    # Field name
                    return setval
                else:
                    return {"field": setval, "default": self.default}
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
        attrname = "_" + self.name
        if isinstance(arg, tuple):
            if len(arg) == 2:
                if not isinstance(arg[0], basestring):
                    raise RuntimeError("String is required for field name when assigning 2-tuple to ColorSpec")
                setattr(obj, attrname, {"field": arg[0], "default": arg[1]})
            elif len(arg) in (3, 4):
                # RGB or RGBa
                setattr(obj, attrname, arg)
            else:
                raise RuntimeError("Invalid tuple being assigned to ColorSpec; must be length 2, 3, or 4.")
        else:
            setattr(obj, attrname, arg)

    def to_dict(self, obj):
        setval = getattr(obj, "_" + self.name, None)
        if setval is not None:
            if self._isconst(setval):
                # Hexadecimal or named color
                return {"value": setval}
            elif isinstance(setval, tuple):
                # RGB or RGBa
                # TODO: Should we validate that alpha is between 0..1?
                return {"value": self._formattuple(setval)}
            elif isinstance(setval, basestring):
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


class MetaGlyph(Viewable):
    """ Handles DataSpecs and other special attribute processing that Glyph
    subclasses need.

    I contemplated making this a class decorator, or monkeypatching the
    Viewable metaclass, but that all seemed more brittle than just
    making a sub-metaclass.
    """

    def __new__(cls, class_name, bases, class_dict):
        # This is a little unorthodox. Usually metaclasses munge the class_dict
        # and attributes before handing off to the base metaclass ctor. In our
        # case, we want the MetaHasProps.__new__ to handle all the machinery
        # of autocreating Property declarations and whatnot, and so we just
        # muck with the class after it's been created.  I've not seen it done
        # this way elsewhere, but it shouldn't be a problem.

        newcls = super(MetaGlyph,cls).__new__(cls, class_name,
                                              bases, class_dict)
        dataspecs = {}
        for attr,val in newcls.__dict__.iteritems():
            if isinstance(val, DataSpec):
                dataspecs[attr] = val
        setattr(newcls, "_dataspecs", dataspecs)
        return newcls


class Glyph(PlotObject):
    """ Base class for all glyphs/marks/geoms/whatever-you-call-'em in Bokeh.
    """

    __metaclass__ = MetaGlyph

    # use __view_model__ for type field in js dict

    # Common attributes for all glyphs
    #color = Color
    #alpha = Percent
    visible = Bool
    margin = Size   # the amount of desired space around this glyph
    halign = Align  # when there is horizontal wiggle room (e.g. categorical)
    valign = Align  # when there is vertical wiggle room

    radius_units = Enum("screen", "data")
    length_units = Enum("screen", "data")
    angle_units = Enum("deg", "rad")
    start_angle_units = Enum("deg", "rad")
    end_angle_units = Enum("deg", "rad")

    def to_glyphspec(self):
        """ Returns a dict mapping attributes to values, that is amenable for
        inclusion in a GlyphRenderer definition.
        """
        d = self.vm_props(withvalues=True)
        d["type"] = self.__view_model__

        # Iterate over all the DataSpec properties and convert them, using the
        # fact that DataSpecs store the dict-ified version on the object.
        for attrname, dspec in self.dataspecs().iteritems():
            d[attrname] = dspec.to_dict(self)
        return d

    def dataspecs(self):
        dataspecs = {}
        for cls in reversed(inspect.getmro(self.__class__)):
            if isinstance(cls, MetaGlyph):
                dataspecs.update(cls._dataspecs)
        return dataspecs

class Marker(Glyph, FillProps, LineProps):
    """ Base class for glyphs which are just simple markers placed at (x,y)
    locations.
    """

    x = DataSpec
    y = DataSpec

    # Override the inherited color properties with ColorSpecs
    fill_color = ColorSpec("gray")
    line_color = ColorSpec("black")

    #fill_pattern = Pattern
    #shape = Enum("circle", "dot", "square", "tri", "diamond", "x", "+", "char")
    #char_value = String

class Circle(Marker):
    __view_model__ = "circle"
    radius = DataSpec(units="screen", default=4)


# Other kinds of Markers, to match what GGplot provides
class Square(Marker):
    __view_model__ = "square"
    size = DataSpec(units="screen", default=4)
    angle = DataSpec

class Triangle(Marker):
    __view_model__ = "triangle"

class Cross(Marker):
    __view_model__ = "cross"

class Xmarker(Marker):
    __view_model__ = "xmarker"

class Diamond(Marker):
    __view_model__ = "diamond"

class InvertedTriangle(Marker):
    __view_model__ = "invertedtriangle"

class SquareX(Marker):
    __view_model__ = "squarex"

class Asterisk(Marker):
    __view_model__ = "asterisk"

class DiamondCross(Marker):
    __view_model__ = "diamondcross"

class CircleCross(Marker):
    __view_model__ = "circlecross"

class HexStar(Marker):
    __view_model__ = "hexstar"

class SquareCross(Marker):
    __view_model__ = "squarecross"

class CircleX(Marker):
    __view_model__ = "circlex"


class AnnularWedge(Glyph, FillProps, LineProps):
    __view_model__ = 'annular_wedge'
    x = DataSpec
    y = DataSpec
    inner_radius = DataSpec
    outer_radius = DataSpec
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum('clock', 'anticlock')

class Annulus(Glyph, FillProps, LineProps):
    __view_model__ = 'annulus'
    x = DataSpec
    y = DataSpec
    inner_radius = DataSpec
    outer_radius = DataSpec

class Arc(Glyph, LineProps):
    __view_model__ = 'arc'
    x = DataSpec
    y = DataSpec
    radius = DataSpec
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum('clock', 'anticlock')

class Bezier(Glyph, LineProps):
    __view_model__ = 'bezier'
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec
    cx0 = DataSpec
    cy0 = DataSpec
    cx1 = DataSpec
    cy1 = DataSpec

# TODO
# class image

class ImageURI(Glyph):
    __view_model__ = 'image_uri'
    x = DataSpec
    y = DataSpec
    angle = DataSpec

class ImageRGBA(Glyph):
    __view_model__ = 'image_rgba'
    image = DataSpec
    width = DataSpec
    height = DataSpec
    x = DataSpec
    y = DataSpec
    dw = DataSpec
    dh = DataSpec

class Line(Glyph, LineProps):
    __view_model__ = "line"
    x = DataSpec
    y = DataSpec

class MultiLine(Glyph, LineProps):
    __view_model__ = 'multi_line'
    xs = DataSpec
    ys = DataSpec

class Oval(Glyph, FillProps, LineProps):
    __view_model__ = 'oval'
    x = DataSpec
    y = DataSpec
    width = DataSpec
    height = DataSpec
    angle = DataSpec

class Patch(Glyph, FillProps, LineProps):
    __view_model__ = 'patch'
    x = DataSpec
    y = DataSpec

class Patches(Glyph, LineProps, FillProps):
    __view_model__ = 'patches'
    xs = DataSpec
    ys = DataSpec

class Quad(Glyph, FillProps, LineProps):
    __view_model__ = "quad"
    left = DataSpec
    right = DataSpec
    bottom = DataSpec
    top = DataSpec

class Quadratic(Glyph, FillProps, LineProps):
    __view_model__ = 'quadcurve'
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec
    cx = DataSpec
    cy = DataSpec

class Ray(Glyph, LineProps):
    __view_model__ = "ray"
    x = DataSpec
    y = DataSpec
    angle = DataSpec
    length = DataSpec

class Rect(Glyph, FillProps, LineProps):
    __view_model__ = "rect"
    x = DataSpec
    y = DataSpec
    width = DataSpec
    height = DataSpec
    angle = DataSpec

class Segment(Glyph, LineProps):
    __view_model__ = 'segment'
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec

class Text(Glyph):
    __view_model__ = "text"
    x = DataSpec
    y = DataSpec
    text = String
    angle = DataSpec

class Wedge(Glyph, FillProps, LineProps):
    __view_model__ = 'wedge'
    x = DataSpec
    y = DataSpec
    radius = DataSpec
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum('clock', 'anticlock')



