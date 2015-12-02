# -*- coding: utf-8 -*-
""" Models for display visual shapes whose attributes can be associated
with data columns from data sources.

"""
from __future__ import absolute_import

from ..enums import Direction, Anchor
from ..mixins import FillProps, LineProps, TextProps
from ..model import Model
from ..properties import (abstract, AngleSpec, Bool, DistanceSpec, Enum, Float,
                          Include, Instance, Int, NumberSpec, StringSpec)
from .. import themes

from .mappers import LinearColorMapper

@abstract
class Glyph(Model):
    """ Base class for all glyph models. """

    def __init__(self, **kwargs):
        props = dict()
        if hasattr(self.__class__, "line_alpha"):
            props.update(themes.default['line_defaults'])
        if hasattr(self.__class__, "fill_alpha"):
            props.update(themes.default['fill_defaults'])
        if hasattr(self.__class__, "text_alpha"):
            props.update(themes.default['text_defaults'])
        props.update(kwargs)
        super(Glyph, self).__init__(**props)

    visible = Bool(True, help="""
    Whether the glyph should render or not.
    """)

class AnnularWedge(Glyph):
    """ Render annular wedges. """

    __example__ = "tests/glyphs/AnnularWedge.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'inner_radius', 'outer_radius', 'start_angle', 'end_angle', 'direction')

    x = NumberSpec("x", help="""
    The x-coordinates of the center of the annular wedges.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates of the center of the annular wedges.
    """)

    inner_radius = DistanceSpec("inner_radius", help="""
    The inner radii of the annular wedges.
    """)

    outer_radius = DistanceSpec("outer_radius", help="""
    The outer radii of the annular wedges.
    """)

    start_angle = AngleSpec("start_angle", help="""
    The angles to start the annular wedges, as measured from the horizontal.
    """)

    end_angle = AngleSpec("end_angle", help="""
    The angles to end the annular wedges, as measured from the horizontal.
    """)

    direction = Enum(Direction, help="""
    Which direction to stroke between the start and end angles.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the annular wedges.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the annular wedges.
    """)

class Annulus(Glyph):
    """ Render annuli. """

    __example__ = "tests/glyphs/Annulus.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'inner_radius', 'outer_radius')

    x = NumberSpec("x", help="""
    The x-coordinates of the center of the annuli.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates of the center of the annuli.
    """)

    inner_radius = DistanceSpec("inner_radius", help="""
    The inner radii of the annuli.
    """)

    outer_radius = DistanceSpec("outer_radius", help="""
    The outer radii of the annuli.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the annuli.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the annuli.
    """)

class Arc(Glyph):
    """ Render arcs. """

    __example__ = "tests/glyphs/Arc.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'radius', 'start_angle', 'end_angle', 'direction')

    x = NumberSpec("x", help="""
    The x-coordinates of the center of the arcs.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates of the center of the arcs.
    """)

    radius = DistanceSpec("radius", help="""
    Radius of the arc.
    """)

    start_angle = AngleSpec("start_angle", help="""
    The angles to start the arcs, as measured from the horizontal.
    """)

    end_angle = AngleSpec("end_angle", help="""
    The angles to end the arcs, as measured from the horizontal.
    """)

    direction = Enum(Direction, help="""
    Which direction to stroke between the start and end angles.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the arcs.
    """)

class Bezier(Glyph):
    u""" Render Bézier curves.

    For more information consult the `Wikipedia article for Bézier curve`_.

    .. _Wikipedia article for Bézier curve: http://en.wikipedia.org/wiki/Bézier_curve
    """

    __example__ = "tests/glyphs/Bezier.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x0', 'y0', 'x1', 'y1', 'cx0', 'cy0', 'cx1', 'cy1')

    x0 = NumberSpec("x0", help="""
    The x-coordinates of the starting points.
    """)

    y0 = NumberSpec("y0", help="""
    The y-coordinates of the starting points.
    """)

    x1 = NumberSpec("x1", help="""
    The x-coordinates of the ending points.
    """)

    y1 = NumberSpec("y1", help="""
    The y-coordinates of the ending points.
    """)

    cx0 = NumberSpec("cx0", help="""
    The x-coordinates of first control points.
    """)

    cy0 = NumberSpec("cy0", help="""
    The y-coordinates of first control points.
    """)

    cx1 = NumberSpec("cx1", help="""
    The x-coordinates of second control points.
    """)

    cy1 = NumberSpec("cy1", help="""
    The y-coordinates of second control points.
    """)

    line_props = Include(LineProps, use_prefix=False, help=u"""
    The %s values for the Bézier curves.
    """)

class Gear(Glyph):
    """ Render gears.

    The details and nomenclature concerning gear construction can
    be quite involved. For more information, consult the `Wikipedia
    article for Gear`_.

    .. _Wikipedia article for Gear: http://en.wikipedia.org/wiki/Gear
    """

    __example__ = "tests/glyphs/Gear.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'angle', 'module', 'teeth', 'pressure_angle', 'shaft_size', 'internal')

    x = NumberSpec("x", help="""
    The x-coordinates of the center of the gears.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates of the center of the gears.
    """)

    angle = AngleSpec(default=0, help="""
    The angle the gears are rotated from horizontal. [rad]
    """)

    module = NumberSpec("module", help="""
    A scaling factor, given by::

        m = p / pi

    where *p* is the circular pitch, defined as the distance from one
    face of a tooth to the corresponding face of an adjacent tooth on
    the same gear, measured along the pitch circle. [float]
    """)

    teeth = NumberSpec("teeth", help="""
    How many teeth the gears have. [int]
    """)

    pressure_angle = NumberSpec(default=20, help="""
    The complement of the angle between the direction that the teeth
    exert force on each other, and the line joining the centers of the
    two gears. [deg]
    """)

    # TODO: (bev) evidently missing a test for default value
    shaft_size = NumberSpec(default=0.3, help="""
    The central gear shaft size as a percentage of the overall gear
    size. [float]
    """)

    # TODO: (bev) evidently missing a test for default value
    internal = NumberSpec(default=False, help="""
    Whether the gear teeth are internal. [bool]
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the gears.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the gears.
    """)

class Image(Glyph):
    """ Render images given as scalar data together with a color mapper. """

    def __init__(self, **kwargs):
        if 'palette' in kwargs and 'color_mapper' in kwargs:
            raise ValueError("only one of 'palette' and 'color_mapper' may be specified")
        elif 'color_mapper' not in kwargs:
            # Use a palette (given or default)
            palette = kwargs.pop('palette', 'Greys9')
            mapper = LinearColorMapper(palette)

            reserve_val = kwargs.pop('reserve_val', None)
            if reserve_val is not None:
                mapper.reserve_val = reserve_val

            reserve_color = kwargs.pop('reserve_color', None)
            if reserve_color is not None:
                mapper.reserve_color = reserve_color

            kwargs['color_mapper'] = mapper

        super(Image, self).__init__(**kwargs)

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('image', 'x', 'y', 'dw', 'dh', 'dilate')

    image = NumberSpec("image", help="""
    The arrays of scalar data for the images to be colormapped.
    """)

    x = NumberSpec("x", help="""
    The x-coordinates to locate the image anchors.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates to locate the image anchors.
    """)

    dw = DistanceSpec("dw", help="""
    The widths of the plot regions that the images will occupy.

    .. note::
        This is not the number of pixels that an image is wide.
        That number is fixed by the image itself.
    """)

    dh = DistanceSpec("dh", help="""
    The height of the plot region that the image will occupy.

    .. note::
        This is not the number of pixels that an image is tall.
        That number is fixed by the image itself.
    """)

    dilate = Bool(False, help="""
    Whether to always round fractional pixel locations in such a way
    as to make the images bigger.

    This setting may be useful if pixel rounding errors are causing
    images to have a gap between them, when they should appear flush.
    """)

    color_mapper = Instance(LinearColorMapper, help="""
    A ``ColorMapper`` to use to map the scalar data from ``image``
    into RGBA values for display.

    .. note::
        The color mapping step happens on the client.
    """)

    # TODO: (bev) support anchor property for Image
    # ref: https://github.com/bokeh/bokeh/issues/1763

class ImageRGBA(Glyph):
    """ Render images given as RGBA data. """

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('image', 'x', 'y', 'dw', 'dh', 'dilate')

    image = NumberSpec("image", help="""
    The arrays of RGBA data for the images.
    """)

    x = NumberSpec("x", help="""
    The x-coordinates to locate the image anchors.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates to locate the image anchors.
    """)

    rows = NumberSpec(None, help="""
    The numbers of rows in the images
    """)

    cols = NumberSpec(None, help="""
    The numbers of columns in the images
    """)

    dw = DistanceSpec("dw", help="""
    The widths of the plot regions that the images will occupy.

    .. note::
        This is not the number of pixels that an image is wide.
        That number is fixed by the image itself.
    """)

    dh = DistanceSpec("dh", help="""
    The height of the plot region that the image will occupy.

    .. note::
        This is not the number of pixels that an image is tall.
        That number is fixed by the image itself.
    """)

    dilate = Bool(False, help="""
    Whether to always round fractional pixel locations in such a way
    as to make the images bigger.

    This setting may be useful if pixel rounding errors are causing
    images to have a gap between them, when they should appear flush.
    """)

    # TODO: (bev) support anchor property for ImageRGBA
    # ref: https://github.com/bokeh/bokeh/issues/1763

class ImageURL(Glyph):
    """ Render images loaded from given URLs. """

    __example__ = "tests/glyphs/ImageURL.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('url', 'x', 'y', 'w', 'h', 'angle', 'global_alpha', 'dilate')

    url = NumberSpec("url", help="""
    The URLs to retrieve images from.

    .. note::
        The actual retrieving and loading of the images happens on
        the client.
    """)

    x = NumberSpec("x", help="""
    The x-coordinates to locate the image anchors.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates to locate the image anchors.
    """)

    # TODO: (bev) rename to "dw" for consistency
    w = DistanceSpec("w", help="""
    The widths of the plot regions that the images will occupy.

    .. note::
        This is not the number of pixels that an image is wide.
        That number is fixed by the image itself.

    .. note::
        This may be renamed to "dw" in the future.
    """)

    # TODO: (bev) rename to "dh" for consistency
    h = DistanceSpec("h", help="""
    The height of the plot region that the image will occupy.

    .. note::
        This is not the number of pixels that an image is tall.
        That number is fixed by the image itself.

    .. note::
        This may be renamed to "dh" in the future.
    """)

    angle = AngleSpec(default=0, help="""
    The angles to rotate the images, as measured from the horizontal.
    """)

    global_alpha = Float(1.0, help="""
    An overall opacity that each image is rendered with (in addition
    to any inherent alpha values in the image itself).
    """)

    dilate = Bool(False, help="""
    Whether to always round fractional pixel locations in such a way
    as to make the images bigger.

    This setting may be useful if pixel rounding errors are causing
    images to have a gap between them, when they should appear flush.
    """)

    anchor = Enum(Anchor, help="""
    What position of the image should be anchored at the `x`, `y`
    coordinates.
    """)

    retry_attempts = Int(0, help="""
    Number of attempts to retry loading the images from the specified URL.
    Default is zero.
    """)

    retry_timeout = Int(0, help="""
    Timeout (in ms) between retry attempts to load the image from the
    specified URL. Default is zero ms.
    """)

class Line(Glyph):
    """ Render a single line.

    .. note::
        The ``Line`` glyph is different from most other glyphs in that
        the vector of values only produces one glyph on the Plot.
    """
    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y')

    __example__ = "tests/glyphs/Line.py"

    x = NumberSpec("x", help="""
    The x-coordinates for the points of the line.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates for the points of the line.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the line.
    """)

class MultiLine(Glyph):
    """ Render several lines.

    .. note::
        The data for the ``MultiLine`` glyph is different in that the
        vector of values is not a vector of scalars. Rather, it is a
        "list of lists".
    """

    __example__ = "tests/glyphs/MultiLine.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('xs', 'ys')

    xs = NumberSpec("xs", help="""
    The x-coordinates for all the lines, given as a "list of lists".
    """)

    ys = NumberSpec("ys", help="""
    The x-coordinates for all the lines, given as a "list of lists".
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the lines.
    """)

class Oval(Glyph):
    u""" Render ovals.

    .. note::
        This glyph renders ovals using Bézier curves, which are similar,
        but not identical to ellipses.
    """

    __example__ = "tests/glyphs/Oval.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'width', 'height', 'angle')

    x = NumberSpec("x", help="""
    The x-coordinates of the centers of the ovals.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates of the centers of the ovals.
    """)

    width = DistanceSpec("width", help="""
    The overall widths of each oval.
    """)

    height = DistanceSpec("height", help="""
    The overall height of each oval.
    """)

    angle = AngleSpec("angle", help="""
    The angle the ovals are rotated from horizontal. [rad]
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the ovals.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the ovals.
    """)

class Patch(Glyph):
    """ Render a single patch.

    .. note::
        The ``Patch`` glyph is different from most other glyphs in that
        the vector of values only produces one glyph on the Plot.
    """

    __example__ = "tests/glyphs/Patch.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y')

    x = NumberSpec("x", help="""
    The x-coordinates for the points of the patch.

    .. note::
        A patch may comprise multiple polygons. In this case the
        x-coordinates for each polygon should be separated by NaN
        values in the sequence.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates for the points of the patch.

    .. note::
        A patch may comprise multiple polygons. In this case the
        y-coordinates for each polygon should be separated by NaN
        values in the sequence.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the patch.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the patch.
    """)

class Patches(Glyph):
    """ Render several patches.

    .. note::
        The data for the ``Patches`` glyph is different in that the
        vector of values is not a vector of scalars. Rather, it is a
        "list of lists".
    """

    __example__ = "tests/glyphs/Patches.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('xs', 'ys')

    xs = NumberSpec("xs", help="""
    The x-coordinates for all the patches, given as a "list of lists".

    .. note::
        Individual patches may comprise multiple polygons. In this case
        the x-coordinates for each polygon should be separated by NaN
        values in the sublists.
    """)

    ys = NumberSpec("ys", help="""
    The y-coordinates for all the patches, given as a "list of lists".

    .. note::
        Individual patches may comprise multiple polygons. In this case
        the y-coordinates for each polygon should be separated by NaN
        values in the sublists.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the patches.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the patches.
    """)

class Quad(Glyph):
    """ Render axis-aligned quads. """

    __example__ = "tests/glyphs/Quad.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('left', 'right', 'top', 'bottom')

    left = NumberSpec("left", help="""
    The x-coordinates of the left edges.
    """)

    right = NumberSpec("right", help="""
    The x-coordinates of the right edges.
    """)

    bottom = NumberSpec("bottom", help="""
    The y-coordinates of the bottom edges.
    """)

    top = NumberSpec("top", help="""
    The y-coordinates of the top edges.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the quads.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the quads.
    """)

class Quadratic(Glyph):
    """ Render parabolas. """

    __example__ = "tests/glyphs/Quadratic.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x0', 'y0', 'x1', 'y1', 'cx', 'cy')

    x0 = NumberSpec("x0", help="""
    The x-coordinates of the starting points.
    """)

    y0 = NumberSpec("y0", help="""
    The y-coordinates of the starting points.
    """)

    x1 = NumberSpec("x1", help="""
    The x-coordinates of the ending points.
    """)

    y1 = NumberSpec("y1", help="""
    The y-coordinates of the ending points.
    """)

    cx = NumberSpec("cx", help="""
    The x-coordinates of the control points.
    """)

    cy = NumberSpec("cy", help="""
    The y-coordinates of the control points.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the parabolas.
    """)

class Ray(Glyph):
    """ Render rays. """

    __example__ = "tests/glyphs/Ray.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'length', 'angle')

    x = NumberSpec("x", help="""
    The x-coordinates to start the rays.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates to start the rays.
    """)

    angle = AngleSpec("angle", help="""
    The angles in radians to extend the rays, as measured from the horizontal.
    """)

    length = DistanceSpec("length", help="""
    The length to extend the ray. Note that this ``length`` defaults
    to screen units.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the rays.
    """)

class Rect(Glyph):
    """ Render rectangles. """

    __example__ = "tests/glyphs/Rect.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'width', 'height', 'angle', 'dilate')

    x = NumberSpec("x", help="""
    The x-coordinates of the centers of the rectangles.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates of the centers of the rectangles.
    """)

    width = DistanceSpec("width", help="""
    The overall widths of the rectangles.
    """)

    height = DistanceSpec("height", help="""
    The overall heights of the rectangles.
    """)

    angle = AngleSpec("angle", help="""
    The angles to rotate the rectangles, as measured from the horizontal.
    """)

    dilate = Bool(False, help="""
    Whether to always round fractional pixel locations in such a way
    as to make the rectangles bigger.

    This setting may be useful if pixel rounding errors are causing
    rectangles to have a gap between them, when they should appear
    flush.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the rectangles.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the rectangles.
    """)

class Segment(Glyph):
    """ Render segments. """

    __example__ = "tests/glyphs/Segment.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x0', 'y0', 'x1', 'y1')

    x0 = NumberSpec("x0", help="""
    The x-coordinates of the starting points.
    """)

    y0 = NumberSpec("y0", help="""
    The y-coordinates of the starting points.
    """)

    x1 = NumberSpec("x1", help="""
    The x-coordinates of the ending points.
    """)

    y1 = NumberSpec("y1", help="""
    The y-coordinates of the ending points.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the segments.
    """)

class Text(Glyph):
    """ Render text. """

    __example__ = "tests/glyphs/Text.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'text', 'angle', 'x_offset', 'y_offset')

    x = NumberSpec("x", help="""
    The x-coordinates to locate the text anchors.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates to locate the text anchors.
    """)

    text = StringSpec("text", help="""
    The text values to render.
    """)

    angle = AngleSpec(default=0, help="""
    The angles to rotate the text, as measured from the horizontal.
    """)

    x_offset = NumberSpec(default=0, help="""
    Offset values to apply to the x-coordinates.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    y_offset = NumberSpec(default=0, help="""
    Offset values to apply to the y-coordinates.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    text_props = Include(TextProps, use_prefix=False, help="""
    The %s values for the text.
    """)

class Wedge(Glyph):
    """ Render wedges.
    """

    __example__ = "tests/glyphs/Wedge.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'radius', 'start_angle', 'end_angle', 'direction')

    x = NumberSpec("x", help="""
    The x-coordinates of the points of the wedges.
    """)

    y = NumberSpec("y", help="""
    The y-coordinates of the points of the wedges.
    """)

    radius = DistanceSpec("radius", help="""
    Radii of the wedges.
    """)

    start_angle = AngleSpec("start_angle", help="""
    The angles to start the wedges, as measured from the horizontal.
    """)

    end_angle = AngleSpec("end_angle", help="""
    The angles to end the wedges, as measured from the horizontal.
    """)

    direction = Enum(Direction, help="""
    Which direction to stroke between the start and end angles.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the wedges.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the wedges.
    """)

# XXX: allow `from bokeh.models.glyphs import *`
from .markers import (Marker, Asterisk, Circle, CircleCross, CircleX, Cross,
                      Diamond, DiamondCross, InvertedTriangle, Square,
                      SquareCross, SquareX, Triangle, X)

# Fool pyflakes
(Marker, Asterisk, Circle, CircleCross, CircleX, Cross, Diamond, DiamondCross,
InvertedTriangle, Square, SquareCross, SquareX, Triangle, X)
