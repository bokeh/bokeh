from .properties import Align, Bool, DataSpec, Enum, HasProps, Size, Any, Color
from .mixins import FillProps, LineProps, TextProps
from .enums import Units, AngleUnits, Direction, Anchor
from .plot_object import PlotObject

from six import add_metaclass, iteritems

# Size is a way to preserve a data-space-related metric all the way until
#   render time, when the screen dimensions are known
# Align may be "center", "min", "max", or "jitter(func)" where func is name
#   of a random distribution to draw random samples from. Defaults to uniform
#   but gaussian could certainly be useful.

class Glyph(PlotObject):
    """ Base class for all glyphs/marks/geoms/whatever-you-call-'em in Bokeh.  """

    visible = Bool
    margin = Size   # the amount of desired space around this glyph
    halign = Align  # when there is horizontal wiggle room (e.g. categorical)
    valign = Align  # when there is vertical wiggle room

    # TODO: all *_units properties should be removed
    size_units = Enum(Units, default=Units.screen)
    radius_units = Enum(Units, default=Units.data)
    length_units = Enum(Units, default=Units.screen)
    angle_units = Enum(AngleUnits, default=AngleUnits.deg)
    start_angle_units = Enum(AngleUnits, default=AngleUnits.deg)
    end_angle_units = Enum(AngleUnits, default=AngleUnits.deg)

class Marker(Glyph, FillProps, LineProps):
    """ Base class for glyphs which are just simple markers placed at (x,y)
    locations.
    """

    x = DataSpec
    y = DataSpec
    size = DataSpec(units="screen", min_value=0, default=4)

class Asterisk(Marker):
    pass

class Circle(Marker):
    radius = DataSpec(units="data", min_value=0)

class CircleCross(Marker):
    pass

class CircleX(Marker):
    pass

class Cross(Marker):
    pass

class Diamond(Marker):
    pass

class DiamondCross(Marker):
    pass

class InvertedTriangle(Marker):
    pass

class Square(Marker):
    angle = DataSpec

class SquareCross(Marker):
    pass

class SquareX(Marker):
    pass

class Triangle(Marker):
    pass

class X(Marker):
    pass

class AnnularWedge(Glyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec
    inner_radius = DataSpec(min_value=0)
    outer_radius = DataSpec(min_value=0)
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum(Direction)

class Annulus(Glyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec
    inner_radius = DataSpec(min_value=0)
    outer_radius = DataSpec(min_value=0)

class Arc(Glyph, LineProps):
    x = DataSpec
    y = DataSpec
    radius = DataSpec(min_value=0)
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum(Direction)

class Bezier(Glyph, LineProps):
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec
    cx0 = DataSpec
    cy0 = DataSpec
    cx1 = DataSpec
    cy1 = DataSpec

class Gear(Glyph, LineProps, FillProps):
    x = DataSpec                          # Float (mm, data)
    y = DataSpec                          # Float (mm, data)
    angle = DataSpec(default=0)           # Float (rad)
    module = DataSpec                     # Float (mm, data)
    teeth = DataSpec                      # Int
    pressure_angle = DataSpec(default=20) # Angle (deg)
    shaft_size = DataSpec(default=0.3)    # Percent
    internal = DataSpec(default=False)    # Bool

class Image(Glyph):
    image = DataSpec
    x = DataSpec
    y = DataSpec
    dw = DataSpec
    dh = DataSpec
    dilate = Bool(False)

    #TODO: Consider converting palette in to a first-class object, then wrap the color list and reserve values into it instead of here
    #Reserve represents a color/value outside of the normal range.  Commonly used to setup a 'background' color for the image
    palette = DataSpec

    #TODO: Using 'False' to indicate no reserve value is not great.  A flag field or sentinel is probably better, but that can be worked out when/if palette becomes its own object
    #The actual type of reserve_val is an instance of whatever is held in the image array, so the exact type will depend on the type of values in the dataspec of the image field.
    reserve_val = Any(default=False)
    reserve_color = DataSpec(default=0xffffff) #TODO: Why doesn't type Color work here?? (Came through as 'undefined' on the JS side)
                                               #TODO: What is the color code for transparent???

class ImageRGBA(Glyph):
    image = DataSpec
    x = DataSpec
    y = DataSpec
    rows = DataSpec
    cols = DataSpec
    dw = DataSpec
    dh = DataSpec
    dilate = Bool(False)

class ImageURL(Glyph):
    url = DataSpec
    x = DataSpec
    y = DataSpec
    w = DataSpec
    h = DataSpec
    angle = DataSpec
    dilate = Bool(False)
    anchor = Enum(Anchor)

class Line(Glyph, LineProps):
    x = DataSpec
    y = DataSpec

class MultiLine(Glyph, LineProps):
    xs = DataSpec
    ys = DataSpec

class Oval(Glyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec
    width = DataSpec
    height = DataSpec
    angle = DataSpec

class Patch(Glyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec

class Patches(Glyph, LineProps, FillProps):
    xs = DataSpec
    ys = DataSpec

class Quad(Glyph, FillProps, LineProps):
    left = DataSpec
    right = DataSpec
    bottom = DataSpec
    top = DataSpec

class Quadratic(Glyph, LineProps):
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec
    cx = DataSpec
    cy = DataSpec

class Ray(Glyph, LineProps):
    x = DataSpec
    y = DataSpec
    angle = DataSpec
    length = DataSpec(units="screen")

class Rect(Glyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec
    width = DataSpec
    height = DataSpec
    angle = DataSpec
    dilate = Bool(False)

class Segment(Glyph, LineProps):
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec

class Text(Glyph, TextProps):
    x = DataSpec
    y = DataSpec
    text = DataSpec
    angle = DataSpec

class Wedge(Glyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec
    radius = DataSpec(min_value=0)
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum(Direction)
