# -*- coding: utf-8 -*-
''' Display a variety of visual shapes whose attributes can be associated
with data columns from ``ColumnDataSources``.

The full list of glyphs built into Bokeh is given below:

* :class:`~bokeh.models.glyphs.AnnularWedge`
* :class:`~bokeh.models.glyphs.Annulus`
* :class:`~bokeh.models.glyphs.Arc`
* :class:`~bokeh.models.glyphs.Bezier`
* :class:`~bokeh.models.glyphs.Ellipse`
* :class:`~bokeh.models.glyphs.HBar`
* :class:`~bokeh.models.glyphs.Image`
* :class:`~bokeh.models.glyphs.ImageRGBA`
* :class:`~bokeh.models.glyphs.ImageURL`
* :class:`~bokeh.models.glyphs.Line`
* :class:`~bokeh.models.glyphs.MultiLine`
* :class:`~bokeh.models.glyphs.Oval`
* :class:`~bokeh.models.glyphs.Patch`
* :class:`~bokeh.models.glyphs.Patches`
* :class:`~bokeh.models.glyphs.Quad`
* :class:`~bokeh.models.glyphs.Quadratic`
* :class:`~bokeh.models.glyphs.Ray`
* :class:`~bokeh.models.glyphs.Rect`
* :class:`~bokeh.models.glyphs.Segment`
* :class:`~bokeh.models.glyphs.Text`
* :class:`~bokeh.models.glyphs.VBar`
* :class:`~bokeh.models.glyphs.Wedge`

All these glyphs share a minimal common interface through their base class
``Glyph``:

.. autoclass:: Glyph
    :members:

'''
from __future__ import absolute_import

from ..core.enums import accept_left_right_center, Anchor, DeprecatedAnchor, Direction
from ..core.has_props import abstract
from ..core.properties import (AngleSpec, Bool, DistanceSpec, Enum, Float,
                               Include, Instance, Int, NumberSpec, StringSpec)
from ..core.property_mixins import FillProps, LineProps, TextProps
from ..model import Model
from ..util.deprecation import deprecated

from .mappers import ColorMapper, LinearColorMapper

@abstract
class Glyph(Model):
    ''' Base class for all glyph models.

    '''

    visible = Bool(True, help="""
    Whether the glyph should render or not.
    """)

class AnnularWedge(Glyph):
    ''' Render annular wedges.

    '''

    __example__ = "tests/glyphs/AnnularWedge.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'inner_radius', 'outer_radius', 'start_angle', 'end_angle', 'direction')

    x = NumberSpec(help="""
    The x-coordinates of the center of the annular wedges.
    """)

    y = NumberSpec(help="""
    The y-coordinates of the center of the annular wedges.
    """)

    inner_radius = DistanceSpec(help="""
    The inner radii of the annular wedges.
    """)

    outer_radius = DistanceSpec(help="""
    The outer radii of the annular wedges.
    """)

    start_angle = AngleSpec(help="""
    The angles to start the annular wedges, as measured from the horizontal.
    """)

    end_angle = AngleSpec(help="""
    The angles to end the annular wedges, as measured from the horizontal.
    """)

    direction = Enum(Direction, default=Direction.anticlock, help="""
    Which direction to stroke between the start and end angles.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the annular wedges.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the annular wedges.
    """)

class Annulus(Glyph):
    ''' Render annuli.

    '''

    __example__ = "tests/glyphs/Annulus.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'inner_radius', 'outer_radius')

    x = NumberSpec(help="""
    The x-coordinates of the center of the annuli.
    """)

    y = NumberSpec(help="""
    The y-coordinates of the center of the annuli.
    """)

    inner_radius = DistanceSpec(help="""
    The inner radii of the annuli.
    """)

    outer_radius = DistanceSpec(help="""
    The outer radii of the annuli.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the annuli.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the annuli.
    """)

class Arc(Glyph):
    ''' Render arcs.

    '''

    __example__ = "tests/glyphs/Arc.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'radius', 'start_angle', 'end_angle', 'direction')

    x = NumberSpec(help="""
    The x-coordinates of the center of the arcs.
    """)

    y = NumberSpec(help="""
    The y-coordinates of the center of the arcs.
    """)

    radius = DistanceSpec(help="""
    Radius of the arc.
    """)

    start_angle = AngleSpec(help="""
    The angles to start the arcs, as measured from the horizontal.
    """)

    end_angle = AngleSpec(help="""
    The angles to end the arcs, as measured from the horizontal.
    """)

    direction = Enum(Direction, default='anticlock', help="""
    Which direction to stroke between the start and end angles.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the arcs.
    """)

class Bezier(Glyph):
    u''' Render Bézier curves.

    For more information consult the `Wikipedia article for Bézier curve`_.

    .. _Wikipedia article for Bézier curve: http://en.wikipedia.org/wiki/Bézier_curve

    '''

    __example__ = "tests/glyphs/Bezier.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x0', 'y0', 'x1', 'y1', 'cx0', 'cy0', 'cx1', 'cy1')

    x0 = NumberSpec(help="""
    The x-coordinates of the starting points.
    """)

    y0 = NumberSpec(help="""
    The y-coordinates of the starting points.
    """)

    x1 = NumberSpec(help="""
    The x-coordinates of the ending points.
    """)

    y1 = NumberSpec(help="""
    The y-coordinates of the ending points.
    """)

    cx0 = NumberSpec(help="""
    The x-coordinates of first control points.
    """)

    cy0 = NumberSpec(help="""
    The y-coordinates of first control points.
    """)

    cx1 = NumberSpec(help="""
    The x-coordinates of second control points.
    """)

    cy1 = NumberSpec(help="""
    The y-coordinates of second control points.
    """)

    line_props = Include(LineProps, use_prefix=False, help=u"""
    The %s values for the Bézier curves.
    """)

class Ellipse(Glyph):
    u''' Render ellipses.

    '''

    __example__ = "tests/glyphs/Ellipse.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'width', 'height', 'angle')

    x = NumberSpec(help="""
    The x-coordinates of the centers of the ellipses.
    """)

    y = NumberSpec(help="""
    The y-coordinates of the centers of the ellipses.
    """)

    width = DistanceSpec(help="""
    The widths of each ellipse.
    """)

    height = DistanceSpec(help="""
    The heights of each ellipse.
    """)

    angle = AngleSpec(default=0.0, help="""
    The angle the ellipses are rotated from horizontal. [rad]
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the ovals.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the ovals.
    """)

class HBar(Glyph):
    ''' Render horizontal bars, given a center coordinate, ``height`` and
    (``left``, ``right``) coordinates.

    '''

    __example__ = "tests/glyphs/HBar.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('y', 'height', 'right', 'left')

    y = NumberSpec(help="""
    The y-coordinates of the centers of the horizontal bars.
    """)

    height = NumberSpec(help="""
    The heights of the vertical bars.
    """)

    left = NumberSpec(default=0, help="""
    The x-coordinates of the left edges.
    """)

    right = NumberSpec(help="""
    The x-coordinates of the right edges.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the horizontal bars.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the horizontal bars.
    """)

class Image(Glyph):
    ''' Render images given as scalar data together with a color mapper.

    In addition to the defined model properties, ``Image`` also can accept
    a keyword argument ``palette`` in place of an explicit ``color_mapper``.
    The value should be a list of colors, or the name of one of the built-in
    palettes in ``bokeh.palettes``. This palette will be used to automatically
    construct a ``ColorMapper`` model for the ``color_mapper`` property.

    If both ``palette`` and ``color_mapper`` are passed, a ``ValueError``
    exception will be raised. If neither is passed, then the ``Greys9``
    palette will be used as a default.

    '''

    def __init__(self, **kwargs):
        if 'palette' in kwargs and 'color_mapper' in kwargs:
            raise ValueError("only one of 'palette' and 'color_mapper' may be specified")
        elif 'color_mapper' not in kwargs:
            # Use a palette (given or default)
            palette = kwargs.pop('palette', 'Greys9')
            mapper = LinearColorMapper(palette)
            kwargs['color_mapper'] = mapper

        super(Image, self).__init__(**kwargs)

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('image', 'x', 'y', 'dw', 'dh', 'dilate')

    # a hook to specify any additional kwargs handled by an initializer
    _extra_kws = {
        'palette': (
            'str or list[color value]',
            'a palette to construct a value for the color mapper property from'
        )
    }

    image = NumberSpec(help="""
    The arrays of scalar data for the images to be colormapped.
    """)

    x = NumberSpec(help="""
    The x-coordinates to locate the image anchors.
    """)

    y = NumberSpec(help="""
    The y-coordinates to locate the image anchors.
    """)

    dw = DistanceSpec(help="""
    The widths of the plot regions that the images will occupy.

    .. note::
        This is not the number of pixels that an image is wide.
        That number is fixed by the image itself.
    """)

    dh = DistanceSpec(help="""
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

    color_mapper = Instance(ColorMapper, help="""
    A ``ColorMapper`` to use to map the scalar data from ``image``
    into RGBA values for display.

    .. note::
        The color mapping step happens on the client.
    """)

    # TODO: (bev) support anchor property for Image
    # ref: https://github.com/bokeh/bokeh/issues/1763

class ImageRGBA(Glyph):
    ''' Render images given as RGBA data.

    '''

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('image', 'x', 'y', 'dw', 'dh', 'dilate')

    image = NumberSpec(help="""
    The arrays of RGBA data for the images.
    """)

    x = NumberSpec(help="""
    The x-coordinates to locate the image anchors.
    """)

    y = NumberSpec(help="""
    The y-coordinates to locate the image anchors.
    """)

    rows = NumberSpec(None, help="""
    The numbers of rows in the images
    """).asserts(False, lambda: deprecated((0, 12, 4), "ImageRGBA.rows", "2D array representation"))

    cols = NumberSpec(None, help="""
    The numbers of columns in the images
    """).asserts(False, lambda: deprecated((0, 12, 4), "ImageRGBA.cols", "2D array representation"))

    dw = DistanceSpec(help="""
    The widths of the plot regions that the images will occupy.

    .. note::
        This is not the number of pixels that an image is wide.
        That number is fixed by the image itself.
    """)

    dh = DistanceSpec(help="""
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
    ''' Render images loaded from given URLs.

    '''

    __example__ = "tests/glyphs/ImageURL.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('url', 'x', 'y', 'w', 'h', 'angle', 'global_alpha', 'dilate')

    url = NumberSpec(help="""
    The URLs to retrieve images from.

    .. note::
        The actual retrieving and loading of the images happens on
        the client.
    """)

    x = NumberSpec(help="""
    The x-coordinates to locate the image anchors.
    """)

    y = NumberSpec(help="""
    The y-coordinates to locate the image anchors.
    """)

    # TODO: (bev) rename to "dw" for consistency
    w = DistanceSpec(help="""
    The widths of the plot regions that the images will occupy.

    .. note::
        This is not the number of pixels that an image is wide.
        That number is fixed by the image itself.

    .. note::
        This may be renamed to "dw" in the future.
    """)

    # TODO: (bev) rename to "dh" for consistency
    h = DistanceSpec(help="""
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
    """).accepts(Enum(DeprecatedAnchor), accept_left_right_center)

    retry_attempts = Int(0, help="""
    Number of attempts to retry loading the images from the specified URL.
    Default is zero.
    """)

    retry_timeout = Int(0, help="""
    Timeout (in ms) between retry attempts to load the image from the
    specified URL. Default is zero ms.
    """)

class Line(Glyph):
    ''' Render a single line.

    The ``Line`` glyph is different from most other glyphs in that the vector
    of values only produces one glyph on the Plot.

    '''
    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y')

    __example__ = "tests/glyphs/Line.py"

    x = NumberSpec(help="""
    The x-coordinates for the points of the line.
    """)

    y = NumberSpec(help="""
    The y-coordinates for the points of the line.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the line.
    """)

class MultiLine(Glyph):
    ''' Render several lines.

    The data for the ``MultiLine`` glyph is different in that the vector of
    values is not a vector of scalars. Rather, it is a "list of lists".

    '''

    __example__ = "tests/glyphs/MultiLine.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('xs', 'ys')

    xs = NumberSpec(help="""
    The x-coordinates for all the lines, given as a "list of lists".
    """)

    ys = NumberSpec(help="""
    The y-coordinates for all the lines, given as a "list of lists".
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the lines.
    """)

class Oval(Glyph):
    u''' Render ovals.

    This glyph renders ovals using Bézier curves, which are similar,
    but not identical to ellipses. In particular, widths equal to heights
    will not render circles. Use the ``Ellipse`` glyph for that.

    '''

    __example__ = "tests/glyphs/Oval.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'width', 'height', 'angle')

    x = NumberSpec(help="""
    The x-coordinates of the centers of the ovals.
    """)

    y = NumberSpec(help="""
    The y-coordinates of the centers of the ovals.
    """)

    width = DistanceSpec(help="""
    The overall widths of each oval.
    """)

    height = DistanceSpec(help="""
    The overall height of each oval.
    """)

    angle = AngleSpec(default=0.0, help="""
    The angle the ovals are rotated from horizontal. [rad]
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the ovals.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the ovals.
    """)

class Patch(Glyph):
    ''' Render a single patch.

    The ``Patch`` glyph is different from most other glyphs in that the vector
    of values only produces one glyph on the Plot.

    '''

    __example__ = "tests/glyphs/Patch.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y')

    x = NumberSpec(help="""
    The x-coordinates for the points of the patch.

    .. note::
        A patch may comprise multiple polygons. In this case the
        x-coordinates for each polygon should be separated by NaN
        values in the sequence.
    """)

    y = NumberSpec(help="""
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
    ''' Render several patches.

    The data for the ``Patches`` glyph is different in that the vector of
    values is not a vector of scalars. Rather, it is a "list of lists".

    '''

    __example__ = "tests/glyphs/Patches.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('xs', 'ys')

    xs = NumberSpec(help="""
    The x-coordinates for all the patches, given as a "list of lists".

    .. note::
        Individual patches may comprise multiple polygons. In this case
        the x-coordinates for each polygon should be separated by NaN
        values in the sublists.
    """)

    ys = NumberSpec(help="""
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
    ''' Render axis-aligned quads.

    '''

    __example__ = "tests/glyphs/Quad.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('left', 'right', 'top', 'bottom')

    left = NumberSpec(help="""
    The x-coordinates of the left edges.
    """)

    right = NumberSpec(help="""
    The x-coordinates of the right edges.
    """)

    bottom = NumberSpec(help="""
    The y-coordinates of the bottom edges.
    """)

    top = NumberSpec(help="""
    The y-coordinates of the top edges.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the quads.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the quads.
    """)

class Quadratic(Glyph):
    ''' Render parabolas.

    '''

    __example__ = "tests/glyphs/Quadratic.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x0', 'y0', 'x1', 'y1', 'cx', 'cy')

    x0 = NumberSpec(help="""
    The x-coordinates of the starting points.
    """)

    y0 = NumberSpec(help="""
    The y-coordinates of the starting points.
    """)

    x1 = NumberSpec(help="""
    The x-coordinates of the ending points.
    """)

    y1 = NumberSpec(help="""
    The y-coordinates of the ending points.
    """)

    cx = NumberSpec(help="""
    The x-coordinates of the control points.
    """)

    cy = NumberSpec(help="""
    The y-coordinates of the control points.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the parabolas.
    """)

class Ray(Glyph):
    ''' Render rays.

    '''

    __example__ = "tests/glyphs/Ray.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'length', 'angle')

    x = NumberSpec(help="""
    The x-coordinates to start the rays.
    """)

    y = NumberSpec(help="""
    The y-coordinates to start the rays.
    """)

    angle = AngleSpec(help="""
    The angles in radians to extend the rays, as measured from the horizontal.
    """)

    length = DistanceSpec(help="""
    The length to extend the ray. Note that this ``length`` defaults
    to screen units.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the rays.
    """)

class Rect(Glyph):
    ''' Render rectangles.

    '''

    __example__ = "tests/glyphs/Rect.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'width', 'height', 'angle', 'dilate')

    x = NumberSpec(help="""
    The x-coordinates of the centers of the rectangles.
    """)

    y = NumberSpec(help="""
    The y-coordinates of the centers of the rectangles.
    """)

    width = DistanceSpec(help="""
    The overall widths of the rectangles.
    """)

    height = DistanceSpec(help="""
    The overall heights of the rectangles.
    """)

    angle = AngleSpec(default=0.0, help="""
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
    ''' Render segments.

    '''

    __example__ = "tests/glyphs/Segment.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x0', 'y0', 'x1', 'y1')

    x0 = NumberSpec(help="""
    The x-coordinates of the starting points.
    """)

    y0 = NumberSpec(help="""
    The y-coordinates of the starting points.
    """)

    x1 = NumberSpec(help="""
    The x-coordinates of the ending points.
    """)

    y1 = NumberSpec(help="""
    The y-coordinates of the ending points.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the segments.
    """)

class Text(Glyph):
    ''' Render text.

    '''

    __example__ = "tests/glyphs/Text.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'text', 'angle', 'x_offset', 'y_offset')

    x = NumberSpec(help="""
    The x-coordinates to locate the text anchors.
    """)

    y = NumberSpec(help="""
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

class VBar(Glyph):
    ''' Render vertical bars, given a center coordinate, width and (top, bottom) coordinates.

    '''

    __example__ = "tests/glyphs/VBar.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'width', 'top', 'bottom')

    x = NumberSpec(help="""
    The x-coordinates of the centers of the vertical bars.
    """)

    width = NumberSpec(help="""
    The widths of the vertical bars.
    """)

    bottom = NumberSpec(default=0, help="""
    The y-coordinates of the bottom edges.
    """)

    top = NumberSpec(help="""
    The y-coordinates of the top edges.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the vertical bars.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the vertical bars.
    """)

class Wedge(Glyph):
    ''' Render wedges.

    '''

    __example__ = "tests/glyphs/Wedge.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'radius', 'start_angle', 'end_angle', 'direction')

    x = NumberSpec(help="""
    The x-coordinates of the points of the wedges.
    """)

    y = NumberSpec(help="""
    The y-coordinates of the points of the wedges.
    """)

    radius = DistanceSpec(help="""
    Radii of the wedges.
    """)

    start_angle = AngleSpec(help="""
    The angles to start the wedges, as measured from the horizontal.
    """)

    end_angle = AngleSpec(help="""
    The angles to end the wedges, as measured from the horizontal.
    """)

    direction = Enum(Direction, default='anticlock', help="""
    Which direction to stroke between the start and end angles.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the wedges.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the wedges.
    """)

# XXX: allow `from bokeh.models.glyphs import *`
from .markers import (Asterisk, Circle, CircleCross, CircleX, Cross, Diamond, DiamondCross,
                      InvertedTriangle, Marker, Square, SquareCross, SquareX, Triangle, X)

# Fool pyflakes
(Asterisk, Circle, CircleCross, CircleX, Cross, Diamond, DiamondCross,
InvertedTriangle, Marker, Square, SquareCross, SquareX, Triangle, X)
