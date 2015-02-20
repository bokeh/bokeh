# -*- coding: utf-8 -*-
""" Models for display visual shapes whose attributes can be associated
with data columns from data sources.

"""
from __future__ import absolute_import

from ..plot_object import PlotObject
from ..mixins import FillProps, LineProps, TextProps
from ..enums import Units, AngleUnits, Direction, Anchor
from ..properties import Align, Bool, DataSpec, Enum, HasProps, Include, Instance, Size

from .mappers import LinearColorMapper

class Glyph(PlotObject):
    """ Base class for all glyphs/marks/geoms/whatever-you-call-'em in Bokeh.

    """

    visible = Bool(help="""
    Whether the glyph should render or not.
    """)

class AnnularWedge(Glyph):
    """ Render annular wedges.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/AnnularWedge.py
        :source-position: none

    *source:* `tests/glyphs/AnnularWedge.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/AnnularWedge.py>`_

    """

    x = DataSpec("x", help="""
    The x-coordinates of the center of the annular wedges.
    """)

    y = DataSpec("y", help="""
    The y-coordinates of the center of the annular wedges.
    """)

    # TODO: (bev) should default to "inner_radius" field?
    inner_radius = DataSpec(min_value=0, help="""
    The inner radii of the annular wedges.
    """)

    # TODO: (bev) should default to "outer_radius" field?
    outer_radius = DataSpec(min_value=0, help="""
    The outer radii of the annular wedges.
    """)

    start_angle = DataSpec("start_angle", help="""
    The angles to start the annular wedges, in radians, as measured from
    the horizontal.
    """)

    end_angle = DataSpec("end_angle", help="""
    The angles to end the annular wedges, in radians, as measured from
    the horizontal.
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
    """ Render annuli.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Annulus.py
        :source-position: none

    *source:* `tests/glyphs/Annulus.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Annulus.py>`_

    """

    x = DataSpec("x", help="""
    The x-coordinates of the center of the annuli.
    """)

    y = DataSpec("y", help="""
    The y-coordinates of the center of the annuli.
    """)

    # TODO: (bev) should default to "inner_radius" field?
    inner_radius = DataSpec(min_value=0, help="""
    The inner radii of the annuli.
    """)

    # TODO: (bev) should default to "outer_radius" field?
    outer_radius = DataSpec(min_value=0, help="""
    The outer radii of the annuli.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the annuli.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the annuli.
    """)

class Arc(Glyph):
    """ Render arcs.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Arc.py
        :source-position: none

    *source:* `tests/glyphs/Arc.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Arc.py>`_

    """

    x = DataSpec("x", help="""
    The x-coordinates of the center of the arcs.
    """)

    y = DataSpec("y", help="""
    The y-coordinates of the center of the arcs.
    """)

    # TODO: (bev) should default to "radius" field?
    radius = DataSpec(min_value=0, help="""
    Radius of the arc.
    """)

    start_angle = DataSpec("start_angle", help="""
    The angles to start the arcs, in radians, as measured from the horizontal.
    """)

    end_angle = DataSpec("end_angle", help="""
    The angles to end the arcs, in radians, as measured from the horizontal.
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

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Bezier.py
        :source-position: none

    *source:* `tests/glyphs/Bezier.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Bezier.py>`_

    """

    x0 = DataSpec("x0", help="""
    The x-coordinates of the starting points.
    """)

    y0 = DataSpec("y0", help="""
    The y-coordinates of the starting points.
    """)

    x1 = DataSpec("x1", help="""
    The x-coordinates of the ending points.
    """)

    y1 = DataSpec("y1", help="""
    The y-coordinates of the ending points.
    """)

    cx0 = DataSpec("cx0", help="""
    The x-coordinates of first control points.
    """)

    cy0 = DataSpec("cy0", help="""
    The y-coordinates of first control points.
    """)

    cx1 = DataSpec("cx1", help="""
    The x-coordinates of second control points.
    """)

    cy1 = DataSpec("cy1", help="""
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

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Gear.py
        :source-position: none

    *source:* `tests/glyphs/Gear.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Gear.py>`_

    """

    x = DataSpec("x", help="""
    The x-coordinates of the center of the gears.
    """)

    y = DataSpec("y", help="""
    The y-coordinates of the center of the gears.
    """)

    angle = DataSpec(default=0, help="""
    The angle the gears are rotated from horizontal. [rad]
    """)

    module = DataSpec("module", help="""
    A scaling factor, given by::

        m = p / pi

    where *p* is the circular pitch, defined as the distance from one
    face of a tooth to the corresponding face of an adjacent tooth on
    the same gear, measured along the pitch circle. [float]
    """)

    teeth = DataSpec("teeth", help="""
    How many teeth the gears have. [int]
    """)

    pressure_angle = DataSpec(default=20, help= """
    The complement of the angle between the direction that the teeth
    exert force on each other, and the line joining the centers of the
    two gears. [deg]
    """)

    # TODO: (bev) evidently missing a test for default value
    shaft_size = DataSpec(default=0.3, help="""
    The central gear shaft size as a percentage of the overall gear
    size. [float]
    """)

    # TODO: (bev) evidently missing a test for default value
    internal = DataSpec(default=False, help="""
    Whether the gear teeth are internal. [bool]
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the gears.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the gears.
    """)

class Image(Glyph):
    """ Render images given as scalar data together with a color
    mapper.

    """

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

    image = DataSpec("image", help="""
    The arrays of scalar data for the images to be colormapped.
    """)

    x = DataSpec("x", help="""
    The x-coordinates to locate the image anchors.
    """)

    y = DataSpec("y", help="""
    The y-coordinates to locate the image anchors.
    """)

    dw = DataSpec("dw", help="""
    The widths of the plot regions that the images will occupy.

    .. note::
        This is not the number of pixels that an image is wide.
        That number is fixed by the image itself.

    """)

    dh = DataSpec("dh", help="""
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
    """ Render images given as RGBA data.

    """

    image = DataSpec("image", help="""
    The arrays of RGBA data for the images.
    """)

    x = DataSpec("x", help="""
    The x-coordinates to locate the image anchors.
    """)

    y = DataSpec("y", help="""
    The y-coordinates to locate the image anchors.
    """)

    rows = DataSpec("rows", help="""
    The numbers of rows in the images
    """)

    cols = DataSpec("cols", help="""
    The numbers of columns in the images
    """)

    dw = DataSpec("dw", help="""
    The widths of the plot regions that the images will occupy.

    .. note::
        This is not the number of pixels that an image is wide.
        That number is fixed by the image itself.

    """)

    dh = DataSpec("dh", help="""
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
    """ Render images loaded from given URLs.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/ImageURL.py
        :source-position: none

    *source:* `tests/glyphs/ImageURL.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/ImageURL.py>`_

    """

    url = DataSpec("url", help="""
    The URLs to retrieve images from.

    .. note::
        The actual retrieving and loading of the images happens on
        the client.

    """)

    x = DataSpec("x", help="""
    The x-coordinates to locate the image anchors.
    """)

    y = DataSpec("y", help="""
    The y-coordinates to locate the image anchors.
    """)

    # TODO: (bev) rename to "dw" for consistency
    w = DataSpec("w", help="""
    The widths of the plot regions that the images will occupy.

    .. note::
        This is not the number of pixels that an image is wide.
        That number is fixed by the image itself.

    .. note::
        This may be renamed to "dw" in the future.

    """)

    # TODO: (bev) rename to "dh" for consistency
    h = DataSpec("h", help="""
    The height of the plot region that the image will occupy.

    .. note::
        This is not the number of pixels that an image is tall.
        That number is fixed by the image itself.

    .. note::
        This may be renamed to "dh" in the future.

    """)

    angle = DataSpec(default=0, help="""
    The angles to rotate the images, in radians as measured from the
    horizontal.
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

class Line(Glyph):
    """ Render a single line.

    .. note::
        The ``Line`` glyph is different from most other glyphs in that
        the vector of values only produces one glyph on the Plot.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Line.py
        :source-position: none

    *source:* `tests/glyphs/Line.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Line.py>`_

    """

    x = DataSpec("x", help="""
    The x-coordinates for the points of the line.
    """)

    y = DataSpec("y", help="""
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

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/MultiLine.py
        :source-position: none

    *source:* `tests/glyphs/MultiLine.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/MultiLine.py>`_

    """
    xs = DataSpec("xs", help="""
    The x-coordinates for all the lines, given as a "list of lists".
    """)

    ys = DataSpec("ys", help="""
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

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Oval.py
        :source-position: none

    *source:* `tests/glyphs/Oval.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Oval.py>`_

    """

    x = DataSpec("x", help="""
    The x-coordinates of the centers of the ovals.
    """)

    y = DataSpec("y", help="""
    The y-coordinates of the centers of the ovals.
    """)

    width = DataSpec("width", help="""
    The overall widths of each oval.
    """)

    height = DataSpec("height", help="""
    The overall height of each oval.
    """)

    angle = DataSpec("angle", help="""
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

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Patch.py
        :source-position: none

    *source:* `tests/glyphs/Patch.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Patch.py>`_

    """

    x = DataSpec("x", help="""
    The x-coordinates for the points of the patch.

    .. note::
        A patch may comprise multiple polygons. In this case the
        x-coordinates for each polygon should be separated by NaN
        values in the sequence.

    """)

    y = DataSpec("y", help="""
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

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Patches.py
        :source-position: none

    *source:* `tests/glyphs/Patches.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Patches.py>`_

    """

    xs = DataSpec("xs", help="""
    The x-coordinates for all the patches, given as a "list of lists".

    .. note::
        Individual patches may comprise multiple polygons. In this case
        the x-coordinates for each polygon should be separated by NaN
        values in the sublists.

    """)

    ys = DataSpec("ys", help="""
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
    """ Render axis-aligned quads.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Quad.py
        :source-position: none

    *source:* `tests/glyphs/Quad.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Quad.py>`_

    """

    left = DataSpec("left", help="""
    The x-coordinates of the left edges.
    """)

    right = DataSpec("right", help="""
    The x-coordinates of the right edges.
    """)

    bottom = DataSpec("bottom", help="""
    The y-coordinates of the bottom edges.
    """)

    top = DataSpec("top", help="""
    The y-coordinates of the top edges.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the quads.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the quads.
    """)

class Quadratic(Glyph):
    """ Render parabolas.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Quadratic.py
        :source-position: none

    *source:* `tests/glyphs/Quadratic.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Quadratic.py>`_

    """

    x0 = DataSpec("x0", help="""
    The x-coordinates of the starting points.
    """)

    y0 = DataSpec("y0", help="""
    The y-coordinates of the starting points.
    """)

    x1 = DataSpec("x1", help="""
    The x-coordinates of the ending points.
    """)

    y1 = DataSpec("y1", help="""
    The y-coordinates of the ending points.
    """)

    cx = DataSpec("cx", help="""
    The x-coordinates of the control points.
    """)

    cy = DataSpec("cy", help="""
    The y-coordinates of the control points.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the parabolas.
    """)

class Ray(Glyph):
    """ Render rays.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Ray.py
        :source-position: none

    *source:* `tests/glyphs/Ray.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Ray.py>`_

    """

    x = DataSpec("x", help="""
    The x-coordinates to start the rays.
    """)

    y = DataSpec("y", help="""
    The y-coordinates to start the rays.
    """)

    angle = DataSpec("angle", help="""
    The angles in radians to extend the rays, as measured from the
    horizontal.
    """)

    # TODO: (bev) should default to "length" field?
    length = DataSpec(units="screen", help="""
    The length to extend the ray. Note that this ``length`` defaults
    to screen units.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the rays.
    """)

class Rect(Glyph):
    """ Render rectangles.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Rect.py
        :source-position: none

    *source:* `tests/glyphs/Rect.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Rect.py>`_

    """

    x = DataSpec("x", help="""
    The x-coordinates of the centers of the rectangles.
    """)

    y = DataSpec("y", help="""
    The y-coordinates of the centers of the rectangles.
    """)

    width = DataSpec("width", help="""
    The overall widths of the rectangles.
    """)

    height = DataSpec("height", help="""
    The overall heights of the rectangles.
    """)

    angle = DataSpec("angle", help="""
    The angles to rotate the rectangles, in radians, as measured from
    the horizontal.
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
    """ Render segments.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Segment.py
        :source-position: none

    *source:* `tests/glyphs/Segment.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Segment.py>`_

    """

    x0 = DataSpec("x0", help="""
    The x-coordinates of the starting points.
    """)

    y0 = DataSpec("y0", help="""
    The y-coordinates of the starting points.
    """)

    x1 = DataSpec("x1", help="""
    The x-coordinates of the ending points.
    """)

    y1 = DataSpec("y1", help="""
    The y-coordinates of the ending points.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the segments.
    """)

class Text(Glyph):
    """ Render text.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Text.py
        :source-position: none

    *source:* `tests/glyphs/Text.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Text.py>`_

    """

    x = DataSpec("x", help="""
    The x-coordinates to locate the text anchors.
    """)

    y = DataSpec("y", help="""
    The y-coordinates to locate the text anchors.
    """)

    text = DataSpec("text", help="""
    The text values to render.
    """)

    angle = DataSpec(default=0, help="""
    The angles to rotate the text, in radians,, as measured from the horizontal.
    """)

    x_offset = DataSpec("x_offset", units="screen", default=0, help="""
    Offset values to apply to the x-coordinates.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    y_offset = DataSpec("y_offset", units="screen", default=0, help="""
    Offset values to apply to the y-coordinates.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in screen units from a given data position.
    """)

    text_props = Include(TextProps, use_prefix=False, help="""
    The %s values for the text.
    """)

class Wedge(Glyph):
    """ Render wedges.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Wedge.py
        :source-position: none

    *source:* `tests/glyphs/Wedge.py <https://github.com/bokeh/bokeh/tree/master/tests/glyphs/Wedge.py>`_

    """

    x = DataSpec("x", help="""
    The x-coordinates of the points of the wedges.
    """)

    y = DataSpec("y", help="""
    The y-coordinates of the points of the wedges.
    """)

    # TODO: (bev) should default to "radius" field?
    radius = DataSpec(min_value=0, help="""
    Radii of the wedges.
    """)

    start_angle = DataSpec("start_angle", help="""
    The angles to start the wedges, in radians, as measured from the horizontal.
    """)

    end_angle = DataSpec("end_angle", help="""
    The angles to end the wedges, in radians as measured from the horizontal.
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
from .markers import *