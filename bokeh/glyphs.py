from .enums import Units, AngleUnits, Direction, Anchor
from .properties import Any, Align, Bool, Color, DataSpec, Enum, HasProps, Instance, Size
from .mixins import FillProps, LineProps, TextProps
from .plot_object import Viewable, PlotObject

from six import add_metaclass, iteritems

# Size is a way to preserve a data-space-related metric all the way until
#   render time, when the screen dimensions are known
# Align may be "center", "min", "max", or "jitter(func)" where func is name
#   of a random distribution to draw random samples from. Defaults to uniform
#   but gaussian could certainly be useful.

class BaseGlyph(PlotObject):
    """ Base class for all glyphs/marks/geoms/whatever-you-call-'em in Bokeh.
    """

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

class Marker(BaseGlyph, FillProps, LineProps):
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

class AnnularWedge(BaseGlyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec
    inner_radius = DataSpec(min_value=0)
    outer_radius = DataSpec(min_value=0)
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum(Direction)

class Annulus(BaseGlyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec
    inner_radius = DataSpec(min_value=0)
    outer_radius = DataSpec(min_value=0)

class Arc(BaseGlyph, LineProps):
    x = DataSpec
    y = DataSpec
    radius = DataSpec(min_value=0)
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum(Direction)

class Bezier(BaseGlyph, LineProps):
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec
    cx0 = DataSpec
    cy0 = DataSpec
    cx1 = DataSpec
    cy1 = DataSpec

class Gear(BaseGlyph, LineProps, FillProps):
    x = DataSpec                          # Float (mm, data)
    y = DataSpec                          # Float (mm, data)
    angle = DataSpec(default=0)           # Float (rad)
    module = DataSpec                     # Float (mm, data)
    teeth = DataSpec                      # Int
    pressure_angle = DataSpec(default=20) # Angle (deg)
    shaft_size = DataSpec(default=0.3)    # Percent
    internal = DataSpec(default=False)    # Bool

class Image(BaseGlyph):
    def __init__(self, **kwargs):
        from .objects import LinearColorMapper
        if 'palette' in kwargs and 'color_mapper' in kwargs:
            raise ValueError("Only one of 'palette' and 'color_mapper' may be specified")
        
        palette = kwargs.pop('palette', None)
        if palette:
            reserve_val = kwargs.pop('reserve_val', LinearColorMapper.reserve_val)
            reserve_color = kwargs.pop('reserve_color', LinearColorMapper.reserve_color)
            kwargs['color_mapper'] = LinearColorMapper(palette, 
                                                       reserve_val=reserve_val, 
                                                       reserve_color=reserve_color)
        super(Image, self).__init__(**kwargs)

    image = DataSpec
    x = DataSpec
    y = DataSpec
    dw = DataSpec
    dh = DataSpec
    dilate = Bool(False)

    color_mapper = Instance(HasProps) # LinearColorMapper but circular import

class ImageRGBA(BaseGlyph):
    image = DataSpec
    x = DataSpec
    y = DataSpec
    dw = DataSpec
    dh = DataSpec
    dilate = Bool(False)
    anchor = Enum(Anchor)

class ImageURL(BaseGlyph):
    url = DataSpec
    x = DataSpec
    y = DataSpec
    w = DataSpec
    h = DataSpec
    angle = DataSpec
    dilate = Bool(False)
    anchor = Enum(Anchor)

class Line(BaseGlyph, LineProps):
    x = DataSpec
    y = DataSpec

class MultiLine(BaseGlyph, LineProps):
    xs = DataSpec
    ys = DataSpec

class Oval(BaseGlyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec
    width = DataSpec
    height = DataSpec
    angle = DataSpec

class Patch(BaseGlyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec

class Patches(BaseGlyph, LineProps, FillProps):
    xs = DataSpec
    ys = DataSpec

class Quad(BaseGlyph, FillProps, LineProps):
    left = DataSpec
    right = DataSpec
    bottom = DataSpec
    top = DataSpec

class Quadratic(BaseGlyph, LineProps):
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec
    cx = DataSpec
    cy = DataSpec

class Ray(BaseGlyph, LineProps):
    x = DataSpec
    y = DataSpec
    angle = DataSpec
    length = DataSpec(units="screen")

class Rect(BaseGlyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec
    width = DataSpec
    height = DataSpec
    angle = DataSpec
    dilate = Bool(False)

class Segment(BaseGlyph, LineProps):
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec

class Text(BaseGlyph, TextProps):
    x = DataSpec
    y = DataSpec
    text = DataSpec
    angle = DataSpec

class Wedge(BaseGlyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec
    radius = DataSpec(min_value=0)
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum(Direction)
