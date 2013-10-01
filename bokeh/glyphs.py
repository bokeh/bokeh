
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

    For colors, because we support named colors and hex values prefaced
    with a "#", when we are handed a string value, there is a little
    interpretation: if the value is one of the 147 SVG named colors or
    it starts with a "#", then it is interpreted as a value.  Otherwise,
    it is treated as a field name.

    If a 3-tuple is provided, then it is treated as an RGB (0..255).
    If a 4-tuple is provided, then it is treated as an RGBa (0..255), with
    alpha as a float between 0 and 1.  (This follows the HTML5 Canvas API.)

    If a 2-tuple is provided, then it is treated as (value/field, default).
    This is the same as the behavior in the base class DataSpec.
    Unlike DataSpec, ColorSpecs do not have a "units" property.

    class Bar(HasProps):
        col = ColorSpec("fill_color", default="gray")
    >>> b = Bar()
    >>> b.col = "red"  # sets a fixed value of red
    >>> b.col
    "red"
    >>> b.col = "mycolor"  # Use the datasource field named "mycolor"
    >>> b.col
    "mycolor"
    >>> b.col = {"name": "mycolor", "default": "#FF126D"}

    For more examples, see tests/test_glyphs.py
    """

    def __init__(self, field=None, default=None, value=None):
        self.field = field
        self.default = default
        self.value = value



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
    #size = Size

    # TODO: Remove this and use the color attributes in Glyph instead
    #stroke_color = Color
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



