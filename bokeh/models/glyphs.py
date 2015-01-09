from __future__ import absolute_import

from math import pi

from ..plot_object import PlotObject
from ..mixins import FillProps, LineProps, TextProps
from ..enums import Units, AngleUnits, Direction, Anchor, Side
from ..properties import Align, Bool, DataSpec, Enum, HasProps, Instance, Size

from .mappers import LinearColorMapper

class Glyph(PlotObject):
    """ Base class for all glyphs/marks/geoms/whatever-you-call-'em in Bokeh.  """
    visible = Bool

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
    def __init__(self, **kwargs):
        if 'palette' in kwargs and 'color_mapper' in kwargs:
            raise ValueError("only one of 'palette' and 'color_mapper' may be specified")

        palette = kwargs.pop('palette', None)
        if palette is not None:
            mapper = LinearColorMapper(palette)

            reserve_val = kwargs.pop('reserve_val', None)
            if reserve_val is not None:
                mapper.reserve_val = reserve_val

            reserve_color = kwargs.pop('reserve_color', None)
            if reserve_color is not None:
                mapper.reserve_color = reserve_color

            kwargs['color_mapper'] = mapper

        super(Image, self).__init__(**kwargs)

    image = DataSpec
    x = DataSpec
    y = DataSpec
    dw = DataSpec
    dh = DataSpec
    dilate = Bool(False)

    color_mapper = Instance(LinearColorMapper)

class ImageRGBA(Glyph):
    image = DataSpec
    x = DataSpec
    y = DataSpec
    rows = DataSpec
    cols = DataSpec
    dw = DataSpec
    dh = DataSpec
    dilate = Bool(False)
    anchor = Enum(Anchor)

class ImageURL(Glyph):
    url = DataSpec
    x = DataSpec
    y = DataSpec
    w = DataSpec
    h = DataSpec
    angle = DataSpec(default=0)
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

class Arrow(Segment, FillProps):
    length = DataSpec(units="screen", default=10)
    angle = DataSpec(default=pi/4)
    side = Enum(Side, default="far")
    filled = DataSpec(default=False)          # Vectorized(Bool, default=False)

class Text(Glyph, TextProps):
    x = DataSpec
    y = DataSpec
    text = DataSpec
    angle = DataSpec(default=0)
    x_offset = DataSpec(units="screen", default=0)
    y_offset = DataSpec(units="screen", default=0)

class Wedge(Glyph, FillProps, LineProps):
    x = DataSpec
    y = DataSpec
    radius = DataSpec(min_value=0)
    start_angle = DataSpec
    end_angle = DataSpec
    direction = Enum(Direction)

from .markers import * # XXX: allow `from bokeh.models.glyphs import *`
