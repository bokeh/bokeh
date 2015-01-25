from __future__ import absolute_import

from ..plot_object import PlotObject
from ..mixins import FillProps, LineProps, TextProps
from ..enums import Units, AngleUnits, Direction, Anchor
from ..properties import Align, Bool, DataSpec, Enum, HasProps, Instance, Size

from .mappers import LinearColorMapper

class Glyph(PlotObject):
    """ Base class for all glyphs/marks/geoms/whatever-you-call-'em in Bokeh.

    """

    visible = Bool

class AnnularWedge(Glyph, FillProps, LineProps):
    """

    """

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

    # TODO: (bev) should default to "inner_radius" field?
    inner_radius = DataSpec(min_value=0, help="""

    """)

    # TODO: (bev) should default to "outer_radius" field?
    outer_radius = DataSpec(min_value=0, help="""

    """)

    start_angle = DataSpec("start_angle", help="""

    """)

    end_angle = DataSpec("end_angle", help="""

    """)

    direction = Enum(Direction, help="""

    """)

class Annulus(Glyph, FillProps, LineProps):
    """

    """

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

    # TODO: (bev) should default to "inner_radius" field?
    inner_radius = DataSpec(min_value=0, help="""

    """)

    # TODO: (bev) should default to "outer_radius" field?
    outer_radius = DataSpec(min_value=0, help="""

    """)

class Arc(Glyph, LineProps):
    """

    """

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

    # TODO: (bev) should default to "radius" field?
    radius = DataSpec(min_value=0, help="""

    """)

    start_angle = DataSpec("start_angle", help="""

    """)

    end_angle = DataSpec("end_angle", help="""

    """)

    direction = Enum(Direction, help="""

    """)

class Bezier(Glyph, LineProps):
    """

    """

    x0 = DataSpec("x0", help="""

    """)

    y0 = DataSpec("y0", help="""

    """)

    x1 = DataSpec("x1", help="""

    """)

    y1 = DataSpec("y1", help="""

    """)

    cx0 = DataSpec("cx0", help="""

    """)

    cy0 = DataSpec("cy0", help="""

    """)

    cx1 = DataSpec("cx1", help="""

    """)

    cy1 = DataSpec("cy1", help="""

    """)

class Gear(Glyph, LineProps, FillProps):
    """

    """

    x = DataSpec("x", help="""

    """) # Float (mm)

    y = DataSpec("y", help="""

    """) # Float (mm)

    angle = DataSpec(default=0, help="""

    """) # Float (rad)

    module = DataSpec("module", help="""

    """) # Float (mm)

    teeth = DataSpec("teeth", help="""

    """) # Int

    pressure_angle = DataSpec(default=20, help= """

    """) # Angle (deg)

    # TODO: (bev) evidently missing a test for default value
    shaft_size = DataSpec(default=0.3, help="""

    """)    # Percent

    # TODO: (bev) evidently missing a test for default value
    internal = DataSpec(default=False, help="""

    """)    # Bool

class Image(Glyph):
    """

    """

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

    image = DataSpec("image", help="""

    """)

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

    dw = DataSpec("dw", help="""

    """)

    dh = DataSpec("dh", help="""

    """)

    dilate = Bool(False, help="""

    """)

    color_mapper = Instance(LinearColorMapper, help="""

    """)

class ImageRGBA(Glyph):
    """

    """

    image = DataSpec("image", help="""

    """)

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

    rows = DataSpec("rows", help="""

    """)

    cols = DataSpec("cols", help="""

    """)

    dw = DataSpec("dw", help="""

    """)

    dh = DataSpec("dh", help="""

    """)

    dilate = Bool(False, help="""

    """)

    anchor = Enum(Anchor, help="""

    """)

class ImageURL(Glyph):
    """

    """

    url = DataSpec("url", help="""

    """)

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

    w = DataSpec("w", help="""

    """)

    h = DataSpec("h", help="""

    """)

    angle = DataSpec(default=0, help="""

    """)

    dilate = Bool(False, help="""

    """)

    anchor = Enum(Anchor, help="""

    """)

class Line(Glyph, LineProps):
    """

    """

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

class MultiLine(Glyph, LineProps):
    """

    """
    xs = DataSpec("xs", help="""

    """)

    ys = DataSpec("ys", help="""

    """)

class Oval(Glyph, FillProps, LineProps):
    """

    """

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

    width = DataSpec("width", help="""

    """)

    height = DataSpec("height", help="""

    """)

    angle = DataSpec("angle", help="""

    """)

class Patch(Glyph, FillProps, LineProps):
    """

    """

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

class Patches(Glyph, LineProps, FillProps):
    """

    """

    xs = DataSpec("xs", help="""

    """)

    ys = DataSpec("ys", help="""

    """)

class Quad(Glyph, FillProps, LineProps):
    """

    """

    left = DataSpec("left", help="""

    """)

    right = DataSpec("right", help="""

    """)

    bottom = DataSpec("bottom", help="""

    """)

    top = DataSpec("top", help="""

    """)

class Quadratic(Glyph, LineProps):
    """

    """

    x0 = DataSpec("x0", help="""

    """)

    y0 = DataSpec("y0", help="""

    """)

    x1 = DataSpec("x1", help="""

    """)

    y1 = DataSpec("y1", help="""

    """)

    cx = DataSpec("cx", help="""

    """)

    cy = DataSpec("cy", help="""

    """)

class Ray(Glyph, LineProps):
    """

    """

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

    angle = DataSpec("angle", help="""

    """)

    # TODO: (bev) should default to "length" field?
    length = DataSpec(units="screen", help="""

    """)

class Rect(Glyph, FillProps, LineProps):
    """

    """

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

    width = DataSpec("width", help="""

    """)

    height = DataSpec("height", help="""

    """)

    angle = DataSpec("angle", help="""

    """)

    dilate = Bool(False, help="""

    """)

class Segment(Glyph, LineProps):
    """

    """

    x0 = DataSpec("x0", help="""

    """)

    y0 = DataSpec("y0", help="""

    """)

    x1 = DataSpec("x1", help="""

    """)

    y1 = DataSpec("y1", help="""

    """)

class Text(Glyph, TextProps):
    """

    """

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

    text = DataSpec("text", help="""

    """)

    angle = DataSpec(default=0, help="""

    """)

    x_offset = DataSpec("x_offset", units="screen", default=0, help="""

    """)

    y_offset = DataSpec("y_offset", units="screen", default=0, help="""

    """)

class Wedge(Glyph, FillProps, LineProps):
    """

    """

    x = DataSpec("x", help="""

    """)

    y = DataSpec("y", help="""

    """)

    # TODO: (bev) should default to "radius" field?
    radius = DataSpec(min_value=0, help="""

    """)

    start_angle = DataSpec("start_angle", help="""

    """)

    end_angle = DataSpec("end_angle", help="""

    """)

    direction = Enum(Direction, help="""

    """)

# XXX: allow `from bokeh.models.glyphs import *`
from .markers import *