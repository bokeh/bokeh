
import inspect

from .properties import (BaseProperty, HasProps, Instance, Enum, Float, Int,
        Color, Percent, Size, Bool, Pattern, Align, Angle, String, FillProps,
        LineProps, TextProps, DataSpec, ColorSpec)

from .objects import PlotObject, Viewable

# Size is a way to preserve a data-space-related metric all the way until
#   render time, when the screen dimensions are known
# Align may be "center", "min", "max", or "jitter(func)" where func is name
#   of a random distribution to draw random samples from. Defaults to uniform
#   but gaussian could certainly be useful.


class Glyph(PlotObject):
    """ Base class for all glyphs/marks/geoms/whatever-you-call-'em in Bokeh.
    """

    # use __view_model__ for type field in js dict

    # Common attributes for all glyphs
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
        for attrname, dspec in self.dataspecs_with_refs().iteritems():
            d[attrname] = dspec.to_dict(self)
        return d


class Marker(Glyph, FillProps, LineProps):
    """ Base class for glyphs which are just simple markers placed at (x,y)
    locations.
    """

    x = DataSpec
    y = DataSpec

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
    __view_model__ = 'quadratic'
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



