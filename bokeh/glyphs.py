
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

#class Scene(object):
#    """ A set of related plots, each with their own panel(s) and each
#    panel representing some coherent coordinate space onto which Glyphs
#    are positioned and rendered.
#    """

class DataSpec(BaseProperty):
    """ Because the BokehJS glyphs support a fixed value or a named
    field for most data fields, we capture that in this property.

    We mirror the JS convention in this Python descriptor.  There are
    multiple ways to set a DataSpec, illustrated below with comments
    and example code.

    class Foo(HasProps):
        x = DataSpec("x", units="data")

    f = Foo()
    f.x = "fieldname"   # Sets x to a field named "fieldname"
    f.x = 12            # Sets x to a default value of 12
    f.x = {"name": "foo", "default": 12}

    Just reading out "f.x" will always retrieve what has been set.
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

        If a constant value is desired, then leave **field** as None and
        set **default** to the fixed value.
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
        # It's kind of an open question what we should return here if the
        # user hasn't set anything yet.  We use our best heuristic and
        # return a name, a default, or a dict with both, depending on
        # what is None.
        if hasattr(obj, "_"+self.name):
            return getattr(obj, "_"+self.name)
        else:
            if self.field is None:
                return self.default
            elif self.default is None:
                return self.field
            else:
                return {"field": self.field, "default": self.default}

    def __set__(self, obj, value):
        setattr(obj, "_"+self.name, value)

    def __delete__(self, obj):
        if hasattr(obj, self.name + "_dict"):
            delattr(obj, self.name + "_dict")
        BaseProperty.__delete__(self, obj)

    def to_dict(self, obj):
        # Build the complete dict
        value = getattr(obj, "_"+self.name, self.default)
        if type(value) == str:
            d = {"field": value, "units": self.units, "default": self.default}
        elif isinstance(value, dict):
            d = {"field": self.field, "units": self.units, "default": self.default}
            d.update(value)
        else:
            # Assume value is a numeric type and is the default value.
            # We explicitly set the field name to None.
            d = {"field": None, "units": self.units, "default": value}
        return d

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

        # TODO: Remove this when we rename the BokehJS fill color attribute
        # from "fill" to "fill_color"
        if "fill_color" in d:
            d["fill"] = d.pop("fill_color")

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



