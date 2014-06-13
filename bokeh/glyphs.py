from .properties import Align, Bool, DataSpec, Enum, HasProps, Size, Any, Color
from .mixins import FillProps, LineProps, TextProps
from .enums import Units, AngleUnits, Direction
from .plot_object import Viewable

from six import add_metaclass, iteritems

# Size is a way to preserve a data-space-related metric all the way until
#   render time, when the screen dimensions are known
# Align may be "center", "min", "max", or "jitter(func)" where func is name
#   of a random distribution to draw random samples from. Defaults to uniform
#   but gaussian could certainly be useful.

@add_metaclass(Viewable)
class BaseGlyph(HasProps):
    """ Base class for all glyphs/marks/geoms/whatever-you-call-'em in Bokeh.
    """

    # use __view_model__ for type field in js dict

    # Common attributes for all glyphs
    visible = Bool
    margin = Size   # the amount of desired space around this glyph
    halign = Align  # when there is horizontal wiggle room (e.g. categorical)
    valign = Align  # when there is vertical wiggle room

    radius_units = Enum(Units)
    length_units = Enum(Units)
    angle_units = Enum(AngleUnits)
    start_angle_units = Enum(AngleUnits)
    end_angle_units = Enum(AngleUnits)

    def to_glyphspec(self):
        """ Returns a dict mapping attributes to values, that is amenable for
        inclusion in a Glyph definition.
        """
        props = self.changed_properties_with_values()
        props["type"] = self.__view_model__

        # Iterate over all the DataSpec properties and convert them, using the
        # fact that DataSpecs store the dict-ified version on the object.
        for attr, spec in iteritems(self.dataspecs_with_refs()):
            props[attr] = spec.to_dict(self)

        return props

class Marker(BaseGlyph, FillProps, LineProps):
    """ Base class for glyphs which are just simple markers placed at (x,y)
    locations.
    """

    x = DataSpec
    y = DataSpec
    size = DataSpec(units="screen", default=4, min_value=0)



class Asterisk(Marker):
    __view_model__ = "asterisk"

class Circle(Marker):
    __view_model__ = "circle"
    radius = DataSpec(units="data", default=4, min_value=0)

    def to_glyphspec(self):
        """ Returns a dict mapping attributes to values, that is amenable for
        inclusion in a Glyph definition.
        """
        d = super(Circle, self).to_glyphspec()

        if "size" not in self._changed_vars and "radius" not in self._changed_vars:
            del d["radius"]
        elif "size" in self._changed_vars:
            del d["radius"]
        elif "radius" in self._changed_vars:
            del d["size"]

        return d

class CircleCross(Marker):
    __view_model__ = "circle_cross"

class CircleX(Marker):
    __view_model__ = "circle_x"

class Cross(Marker):
    __view_model__ = "cross"

class Diamond(Marker):
    __view_model__ = "diamond"

class DiamondCross(Marker):
    __view_model__ = "diamond_cross"

class InvertedTriangle(Marker):
    __view_model__ = "inverted_triangle"

class Square(Marker):
    __view_model__ = "square"
    angle = DataSpec

class SquareCross(Marker):
    __view_model__ = "square_cross"

class SquareX(Marker):
    __view_model__ = "square_x"

class Triangle(Marker):
    __view_model__ = "triangle"

class Xmarker(Marker):
    __view_model__ = "x"



class AnnularWedge(BaseGlyph, FillProps, LineProps):
    __view_model__ = 'annular_wedge'
    x = DataSpec
    y = DataSpec
    inner_radius = DataSpec(min_value=0)
    outer_radius = DataSpec(min_value=0)
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum(Direction)

class Annulus(BaseGlyph, FillProps, LineProps):
    __view_model__ = 'annulus'
    x = DataSpec
    y = DataSpec
    inner_radius = DataSpec(min_value=0)
    outer_radius = DataSpec(min_value=0)

class Arc(BaseGlyph, LineProps):
    __view_model__ = 'arc'
    x = DataSpec
    y = DataSpec
    radius = DataSpec(min_value=0)
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum(Direction)

class Bezier(BaseGlyph, LineProps):
    __view_model__ = 'bezier'
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec
    cx0 = DataSpec
    cy0 = DataSpec
    cx1 = DataSpec
    cy1 = DataSpec

class Image(BaseGlyph):
    __view_model__ = 'image'
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

class ImageURL(BaseGlyph):
    __view_model__ = 'image_url'
    url = DataSpec
    x = DataSpec
    y = DataSpec
    w = DataSpec
    h = DataSpec
    angle = DataSpec
    dilate = Bool(False)
    anchor = Enum("top_left", "top_center", "top_right", "right_center", "bottom_right",
                  "bottom_center", "bottom_left", "left_center", "center")

class ImageRGBA(BaseGlyph):
    __view_model__ = 'image_rgba'
    image = DataSpec
    x = DataSpec
    y = DataSpec
    dw = DataSpec
    dh = DataSpec
    dilate = Bool(False)

class Line(BaseGlyph, LineProps):
    __view_model__ = "line"
    x = DataSpec
    y = DataSpec

class MultiLine(BaseGlyph, LineProps):
    __view_model__ = 'multi_line'
    xs = DataSpec
    ys = DataSpec

class Oval(BaseGlyph, FillProps, LineProps):
    __view_model__ = 'oval'
    x = DataSpec
    y = DataSpec
    width = DataSpec
    height = DataSpec
    angle = DataSpec

class Patch(BaseGlyph, FillProps, LineProps):
    __view_model__ = 'patch'
    x = DataSpec
    y = DataSpec

class Patches(BaseGlyph, LineProps, FillProps):
    __view_model__ = 'patches'
    xs = DataSpec
    ys = DataSpec

class Quad(BaseGlyph, FillProps, LineProps):
    __view_model__ = "quad"
    left = DataSpec
    right = DataSpec
    bottom = DataSpec
    top = DataSpec

class Quadratic(BaseGlyph, LineProps):
    __view_model__ = 'quadratic'
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec
    cx = DataSpec
    cy = DataSpec

class Ray(BaseGlyph, LineProps):
    __view_model__ = "ray"
    x = DataSpec
    y = DataSpec
    angle = DataSpec
    length = DataSpec

class Rect(BaseGlyph, FillProps, LineProps):
    __view_model__ = "rect"
    x = DataSpec
    y = DataSpec
    width = DataSpec
    height = DataSpec
    angle = DataSpec
    dilate = Bool(False)

class Segment(BaseGlyph, LineProps):
    __view_model__ = 'segment'
    x0 = DataSpec
    y0 = DataSpec
    x1 = DataSpec
    y1 = DataSpec

class Text(BaseGlyph, TextProps):
    __view_model__ = "text"
    x = DataSpec
    y = DataSpec
    text = DataSpec
    angle = DataSpec

class Wedge(BaseGlyph, FillProps, LineProps):
    __view_model__ = 'wedge'
    x = DataSpec
    y = DataSpec
    radius = DataSpec(min_value=0)
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum(Direction)

class Gear(BaseGlyph, LineProps, FillProps):
    __view_model__ = 'gear'
    x = DataSpec                          # Float (mm, data)
    y = DataSpec                          # Float (mm, data)
    angle = DataSpec(default=0)           # Float (rad)
    module = DataSpec                     # Float (mm, data)
    teeth = DataSpec                      # Int
    pressure_angle = DataSpec(default=20) # Angle (deg)
    shaft_size = DataSpec(default=0.3)    # Percent
    internal = DataSpec(default=False)    # Bool
