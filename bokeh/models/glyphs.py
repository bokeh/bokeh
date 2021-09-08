#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Display a variety of visual shapes whose attributes can be associated
with data columns from ``ColumnDataSources``.



The full list of glyphs is below:

.. toctree::
   :maxdepth: 2
   :glob:

   glyphs/*

All glyphs share a minimal common interface through the base class ``Glyph``:

.. bokeh-model:: Glyph
    :module: bokeh.models.glyphs

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.enums import (
    Anchor,
    Direction,
    StepMode,
    enumeration,
)
from ..core.has_props import abstract
from ..core.properties import (
    AngleSpec,
    Bool,
    DistanceSpec,
    Enum,
    Float,
    Include,
    Instance,
    Int,
    MarkerSpec,
    NullDistanceSpec,
    NumberSpec,
    Override,
    Size,
    SizeSpec,
    String,
    StringSpec,
)
from ..core.property.dataspec import field
from ..core.property_mixins import (
    FillProps,
    HatchProps,
    LineProps,
    ScalarFillProps,
    ScalarHatchProps,
    ScalarLineProps,
    TextProps,
)
from ..util.deprecation import deprecated
from .glyph import (
    ConnectedXYGlyph,
    FillGlyph,
    Glyph,
    HatchGlyph,
    LineGlyph,
    TextGlyph,
    XYGlyph,
)
from .mappers import ColorMapper, LinearColorMapper

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'AnnularWedge',
    'Annulus',
    'Arc',
    'Bezier',
    'ConnectedXYGlyph',
    'Ellipse',
    'Glyph',
    'HArea',
    'HBar',
    'HexTile',
    'Image',
    'ImageRGBA',
    'ImageURL',
    'Line',
    'Marker',
    'MultiLine',
    'MultiPolygons',
    'Oval',
    'Patch',
    'Patches',
    'Quad',
    'Quadratic',
    'Ray',
    'Rect',
    'Segment',
    'Step',
    'Text',
    'VArea',
    'VBar',
    'Wedge',
    'XYGlyph',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Marker(XYGlyph, LineGlyph, FillGlyph, HatchGlyph):
    ''' Base class for glyphs that are simple markers with line and
    fill properties, located at an (x, y) location with a specified
    size.

    .. note::
        For simplicity, all markers have both line and fill properties
        declared, however some marker types (`asterisk`, `cross`, `x`)
        only draw lines. For these markers, the fill values are simply
        ignored.

    '''

    _args = ('x', 'y', 'size', 'angle')

    x = NumberSpec(default=field("x"), help="""
    The x-axis coordinates for the center of the markers.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-axis coordinates for the center of the markers.
    """)

    hit_dilation = Size(default=1.0, help="""
    The factor by which to dilate the hit radius
    which is responsible for defining the range in which a
    marker responds to interactions with the Hover and Tap
    tools.
    """)

    size = SizeSpec(default=4, help="""
    The size (diameter) values for the markers in screen space units.
    """)

    angle = AngleSpec(default=0.0, help="""
    The angles to rotate the markers.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the markers.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the markers.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the markers.
    """)

class AnnularWedge(XYGlyph, LineGlyph, FillGlyph, HatchGlyph):
    ''' Render annular wedges.

    '''

    __example__ = "examples/reference/models/AnnularWedge.py"

    _args = ('x', 'y', 'inner_radius', 'outer_radius', 'start_angle', 'end_angle', 'direction')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates of the center of the annular wedges.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates of the center of the annular wedges.
    """)

    inner_radius = DistanceSpec(default=field("inner_radius"), help="""
    The inner radii of the annular wedges.
    """)

    outer_radius = DistanceSpec(default=field("outer_radius"), help="""
    The outer radii of the annular wedges.
    """)

    start_angle = AngleSpec(default=field("start_angle"), help="""
    The angles to start the annular wedges, as measured from the horizontal.
    """)

    end_angle = AngleSpec(default=field("end_angle"), help="""
    The angles to end the annular wedges, as measured from the horizontal.
    """)

    direction = Enum(Direction, default=Direction.anticlock, help="""
    Which direction to stroke between the start and end angles.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the annular wedges.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the annular wedges.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the annular wedges.
    """)

class Annulus(XYGlyph, LineGlyph, FillGlyph, HatchGlyph):
    ''' Render annuli.

    '''

    __example__ = "examples/reference/models/Annulus.py"

    _args = ('x', 'y', 'inner_radius', 'outer_radius')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates of the center of the annuli.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates of the center of the annuli.
    """)

    inner_radius = DistanceSpec(default=field("inner_radius"), help="""
    The inner radii of the annuli.
    """)

    outer_radius = DistanceSpec(default=field("outer_radius"), help="""
    The outer radii of the annuli.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the annuli.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the annuli.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the annuli.
    """)

class Arc(XYGlyph, LineGlyph):
    ''' Render arcs.

    '''

    __example__ = "examples/reference/models/Arc.py"

    _args = ('x', 'y', 'radius', 'start_angle', 'end_angle', 'direction')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates of the center of the arcs.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates of the center of the arcs.
    """)

    radius = DistanceSpec(default=field("radius"), help="""
    Radius of the arc.
    """)

    start_angle = AngleSpec(default=field("start_angle"), help="""
    The angles to start the arcs, as measured from the horizontal.
    """)

    end_angle = AngleSpec(default=field("end_angle"), help="""
    The angles to end the arcs, as measured from the horizontal.
    """)

    direction = Enum(Direction, default='anticlock', help="""
    Which direction to stroke between the start and end angles.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the arcs.
    """)

class Bezier(LineGlyph):
    ''' Render Bezier curves.

    For more information consult the `Wikipedia article for Bezier curve`_.

    .. _Wikipedia article for Bezier curve: http://en.wikipedia.org/wiki/Bezier_curve

    '''

    __example__ = "examples/reference/models/Bezier.py"

    _args = ("x0", "y0", "x1", "y1", "cx0", "cy0", "cx1", "cy1")

    x0 = NumberSpec(default=field("x0"), help="""
    The x-coordinates of the starting points.
    """)

    y0 = NumberSpec(default=field("y0"), help="""
    The y-coordinates of the starting points.
    """)

    x1 = NumberSpec(default=field("x1"), help="""
    The x-coordinates of the ending points.
    """)

    y1 = NumberSpec(default=field("y1"), help="""
    The y-coordinates of the ending points.
    """)

    cx0 = NumberSpec(default=field("cx0"), help="""
    The x-coordinates of first control points.
    """)

    cy0 = NumberSpec(default=field("cy0"), help="""
    The y-coordinates of first control points.
    """)

    cx1 = NumberSpec(default=field("cx1"), help="""
    The x-coordinates of second control points.
    """)

    cy1 = NumberSpec(default=field("cy1"), help="""
    The y-coordinates of second control points.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the Bezier curves.
    """)

class Circle(Marker):
    ''' Render circle markers. '''

    __example__ = "examples/reference/models/Circle.py"

    _args = ('x', 'y')

    radius = NullDistanceSpec(help="""
    The radius values for circle markers (in |data units|, by default).

    .. note::
        Circle markers are slightly unusual in that they support specifying
        a radius in addition to a size. Only one of ``radius`` or ``size``
        should be given.

    .. warning::
        Note that ``Circle`` glyphs are always drawn as circles on the screen,
        even in cases where the data space aspect ratio is not 1-1. In all
        cases where radius values are specified, the "distance" for the radius
        is measured along the dimension specified by ``radius_dimension``. If
        the aspect ratio is very large or small, the drawn circles may appear
        much larger or smaller than expected. See :bokeh-issue:`626` for more
        information.

    """)

    radius_dimension = Enum(enumeration('x', 'y', 'max', 'min'), help="""
    What dimension to measure circle radii along.

    When the data space aspect ratio is not 1-1, then the size of the drawn
    circles depends on what direction is used to measure the "distance" of
    the radius. This property allows that direction to be controlled.

    Setting this dimension to 'max' will calculate the radius on both the x
    and y dimensions and use the maximum of the two, 'min' selects the minimum.
    """)

class Ellipse(XYGlyph, LineGlyph, FillGlyph, HatchGlyph):
    ''' Render ellipses.

    '''

    __example__ = "examples/reference/models/Ellipse.py"

    _args = ('x', 'y', 'width', 'height', 'angle')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates of the centers of the ellipses.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates of the centers of the ellipses.
    """)

    width = DistanceSpec(default=field("width"), help="""
    The widths of each ellipse.
    """)

    height = DistanceSpec(default=field("height"), help="""
    The heights of each ellipse.
    """)

    angle = AngleSpec(default=0.0, help="""
    The angle the ellipses are rotated from horizontal. [rad]
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the ellipses.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the ellipses.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the ellipses.
    """)

class HArea(LineGlyph, FillGlyph, HatchGlyph):
    ''' Render a horizontally directed area between two equal length sequences
    of x-coordinates with the same y-coordinates.

    '''

    __example__ = "examples/reference/models/HArea.py"

    _args = ('x1', 'x2', 'y')

    x1 = NumberSpec(default=field("x1"), help="""
    The x-coordinates for the points of one side of the area.
    """)

    x2 = NumberSpec(default=field("x2"), help="""
    The x-coordinates for the points of the other side of the area.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates for the points of the area.
    """)

    fill_props = Include(ScalarFillProps, help="""
    The {prop} values for the horizontal directed area.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the horizontal directed area.
    """)

class HBar(LineGlyph, FillGlyph, HatchGlyph):
    ''' Render horizontal bars, given a center coordinate, ``height`` and
    (``left``, ``right``) coordinates.

    '''

    __example__ = "examples/reference/models/HBar.py"

    _args = ('y', 'height', 'right', 'left')

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates of the centers of the horizontal bars.
    """)

    height = NumberSpec(default=1, help="""
    The heights of the vertical bars.
    """)

    left = NumberSpec(default=0, help="""
    The x-coordinates of the left edges.
    """)

    right = NumberSpec(default=field("right"), help="""
    The x-coordinates of the right edges.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the horizontal bars.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the horizontal bars.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the horizontal bars.
    """)

class HexTile(LineGlyph, FillGlyph, HatchGlyph):
    ''' Render horizontal tiles on a regular hexagonal grid.

    '''

    __example__ = "examples/reference/models/HexTile.py"

    _args = ('q', 'r')

    size = Float(1.0, help="""
    The radius (in |data units|) of the hex tiling.

    The radius is always measured along the cartesian y-axis for "pointy_top"
    orientation, and along the cartesian x-axis for "flat_top" orientation. If
    the aspect ratio of the underlying cartesian system is not 1-1, then the
    tiles may be "squished" in one direction. To ensure that the tiles are
    always regular hexagons, consider setting the ``match_aspect`` property of
    the plot to True.
    """)

    aspect_scale = Float(1.0, help="""

    """)

    r = NumberSpec(default=field("r"), help="""
    The "row" axial coordinates of the tile centers.
    """)

    q = NumberSpec(default=field("q"), help="""
    The "column" axial coordinates of the tile centers.
    """)

    scale = NumberSpec(1.0, help="""
    A scale factor for individual tiles.
    """)

    orientation = String("pointytop", help="""

    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the hex tiles.
    """)

    line_color = Override(default=None)

    fill_props = Include(FillProps, help="""
    The {prop} values for the hex tiles.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the hex tiles.
    """)

class Image(XYGlyph):
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

    def __init__(self, **kwargs) -> None:
        if 'palette' in kwargs and 'color_mapper' in kwargs:
            raise ValueError("only one of 'palette' and 'color_mapper' may be specified")
        elif 'color_mapper' not in kwargs:
            # Use a palette (given or default)
            palette = kwargs.pop('palette', 'Greys9')
            mapper = LinearColorMapper(palette)
            kwargs['color_mapper'] = mapper

        super().__init__(**kwargs)

    _args = ('image', 'x', 'y', 'dw', 'dh', 'dilate')

    # a hook to specify any additional kwargs handled by an initializer
    _extra_kws = {
        'palette': (
            'str or list[color value]',
            'a palette to construct a value for the color mapper property from'
        )
    }

    image = NumberSpec(default=field("image"), help="""
    The arrays of scalar data for the images to be colormapped.
    """)

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates to locate the image anchors.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates to locate the image anchors.
    """)

    dw = DistanceSpec(default=field("dw"), help="""
    The widths of the plot regions that the images will occupy.

    .. note::
        This is not the number of pixels that an image is wide.
        That number is fixed by the image itself.
    """)

    dh = DistanceSpec(default=field("dh"), help="""
    The height of the plot region that the image will occupy.

    .. note::
        This is not the number of pixels that an image is tall.
        That number is fixed by the image itself.
    """)

    global_alpha = NumberSpec(1.0, help="""
    An overall opacity that each image is rendered with (in addition
    to any alpha values applied explicitly in a color mapper).
    """)

    dilate = Bool(False, help="""
    Whether to always round fractional pixel locations in such a way
    as to make the images bigger.

    This setting may be useful if pixel rounding errors are causing
    images to have a gap between them, when they should appear flush.
    """)

    color_mapper = Instance(ColorMapper, lambda: LinearColorMapper(palette="Greys9"), help="""
    A ``ColorMapper`` to use to map the scalar data from ``image``
    into RGBA values for display.

    .. note::
        The color mapping step happens on the client.
    """)

    # TODO: (bev) support anchor property for Image
    # ref: https://github.com/bokeh/bokeh/issues/1763

class ImageRGBA(XYGlyph):
    ''' Render images given as RGBA data.

    '''

    _args = ('image', 'x', 'y', 'dw', 'dh', 'dilate')

    image = NumberSpec(default=field("image"), help="""
    The arrays of RGBA data for the images.
    """)

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates to locate the image anchors.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates to locate the image anchors.
    """)

    dw = DistanceSpec(default=field("dw"), help="""
    The widths of the plot regions that the images will occupy.

    .. note::
        This is not the number of pixels that an image is wide.
        That number is fixed by the image itself.
    """)

    dh = DistanceSpec(default=field("dh"), help="""
    The height of the plot region that the image will occupy.

    .. note::
        This is not the number of pixels that an image is tall.
        That number is fixed by the image itself.
    """)

    global_alpha = NumberSpec(1.0, help="""
    An overall opacity that each image is rendered with (in addition
    to any inherent alpha values in the image itself).
    """)

    dilate = Bool(False, help="""
    Whether to always round fractional pixel locations in such a way
    as to make the images bigger.

    This setting may be useful if pixel rounding errors are causing
    images to have a gap between them, when they should appear flush.
    """)

    # TODO: (bev) support anchor property for ImageRGBA
    # ref: https://github.com/bokeh/bokeh/issues/1763

class ImageURL(XYGlyph):
    ''' Render images loaded from given URLs.

    '''

    __example__ = "examples/reference/models/ImageURL.py"

    _args = ('url', 'x', 'y', 'w', 'h', 'angle', 'dilate')

    url = StringSpec(default=field("url"), help="""
    The URLs to retrieve images from.

    .. note::
        The actual retrieving and loading of the images happens on
        the client.
    """)

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates to locate the image anchors.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates to locate the image anchors.
    """)

    w = NullDistanceSpec(help="""
    The width of the plot region that the image will occupy in data space.

    The default value is ``None``, in which case the image will be displayed
    at its actual image size (regardless of the units specified here).
    """)

    h = NullDistanceSpec(help="""
    The height of the plot region that the image will occupy in data space.

    The default value is ``None``, in which case the image will be displayed
    at its actual image size (regardless of the units specified here).
    """)

    angle = AngleSpec(default=0, help="""
    The angles to rotate the images, as measured from the horizontal.
    """)

    global_alpha = NumberSpec(1.0, help="""
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

class Line(ConnectedXYGlyph, LineGlyph):
    ''' Render a single line.

    The ``Line`` glyph is different from most other glyphs in that the vector
    of values only produces one glyph on the Plot.

    .. note::
        Due to limitations in the underlying HTML canvas, it is possible that a
        line is not drawn when one or more of its coordinates is very far outside
        the viewport. This behavior is different for different browsers. See
        :bokeh-issue:`11498` for more information.

    '''
    _args = ('x', 'y')

    __example__ = "examples/reference/models/Line.py"

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates for the points of the line.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates for the points of the line.
    """)

    line_props = Include(ScalarLineProps, help="""
    The {prop} values for the line.
    """)

class MultiLine(LineGlyph):
    ''' Render several lines.

    The data for the ``MultiLine`` glyph is different in that the vector of
    values is not a vector of scalars. Rather, it is a "list of lists".

    '''

    __example__ = "examples/reference/models/MultiLine.py"

    _args = ('xs', 'ys')

    xs = NumberSpec(default=field("xs"), help="""
    The x-coordinates for all the lines, given as a "list of lists".
    """)

    ys = NumberSpec(default=field("ys"), help="""
    The y-coordinates for all the lines, given as a "list of lists".
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the lines.
    """)

class MultiPolygons(LineGlyph, FillGlyph, HatchGlyph):
    ''' Render several MultiPolygon.

    Modeled on geoJSON - the data for the ``MultiPolygons`` glyph is
    different in that the vector of values is not a vector of scalars.
    Rather, it is a "list of lists of lists of lists".

    During box selection only multi-polygons entirely contained in the
    selection box will be included.

    '''

    __example__ = "examples/reference/models/MultiPolygons.py"

    _args = ('xs', 'ys')

    xs = NumberSpec(default=field("xs"), help="""
    The x-coordinates for all the patches, given as a nested list.

    .. note::
        Each item in ``MultiPolygons`` represents one MultiPolygon and each
        MultiPolygon is comprised of ``n`` Polygons. Each Polygon is made of
        one exterior ring optionally followed by ``m`` interior rings (holes).
    """)

    ys = NumberSpec(default=field("ys"), help="""
    The y-coordinates for all the patches, given as a "list of lists".

    .. note::
        Each item in ``MultiPolygons`` represents one MultiPolygon and each
        MultiPolygon is comprised of ``n`` Polygons. Each Polygon is made of
        one exterior ring optionally followed by ``m`` interior rings (holes).
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the multipolygons.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the multipolygons.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the multipolygons.
    """)

class Oval(XYGlyph, LineGlyph, FillGlyph, HatchGlyph):
    ''' Render ovals.

    This glyph renders ovals using Bezier curves, which are similar,
    but not identical to ellipses. In particular, widths equal to heights
    will not render circles. Use the ``Ellipse`` glyph for that.

    '''

    def __init__(self, **kwargs) -> None:
        deprecated("'Oval' is deprecated and will be removed in Bokeh 3.0, use the Ellipse glyph instead")
        super().__init__(**kwargs)

    __example__ = "examples/reference/models/Oval.py"

    _args = ('x', 'y', 'width', 'height', 'angle')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates of the centers of the ovals.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates of the centers of the ovals.
    """)

    width = DistanceSpec(default=field("width"), help="""
    The overall widths of each oval.
    """)

    height = DistanceSpec(default=field("height"), help="""
    The overall height of each oval.
    """)

    angle = AngleSpec(default=0.0, help="""
    The angle the ovals are rotated from horizontal. [rad]
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the ovals.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the ovals.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the ovals.
    """)

class Patch(ConnectedXYGlyph, LineGlyph, FillGlyph, HatchGlyph):
    ''' Render a single patch.

    The ``Patch`` glyph is different from most other glyphs in that the vector
    of values only produces one glyph on the Plot.

    '''

    __example__ = "examples/reference/models/Patch.py"

    _args = ('x', 'y')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates for the points of the patch.

    .. note::
        A patch may comprise multiple polygons. In this case the
        x-coordinates for each polygon should be separated by NaN
        values in the sequence.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates for the points of the patch.

    .. note::
        A patch may comprise multiple polygons. In this case the
        y-coordinates for each polygon should be separated by NaN
        values in the sequence.
    """)

    line_props = Include(ScalarLineProps, help="""
    The {prop} values for the patch.
    """)

    fill_props = Include(ScalarFillProps, help="""
    The {prop} values for the patch.
    """)

    hatch_props = Include(ScalarHatchProps, help="""
    The {prop} values for the patch.
    """)

class Patches(LineGlyph, FillGlyph, HatchGlyph):
    ''' Render several patches.

    The data for the ``Patches`` glyph is different in that the vector of
    values is not a vector of scalars. Rather, it is a "list of lists".

    During box selection only patches entirely contained in the
    selection box will be included.

    '''

    __example__ = "examples/reference/models/Patches.py"

    _args = ('xs', 'ys')

    xs = NumberSpec(default=field("xs"), help="""
    The x-coordinates for all the patches, given as a "list of lists".

    .. note::
        Individual patches may comprise multiple polygons. In this case
        the x-coordinates for each polygon should be separated by NaN
        values in the sublists.
    """)

    ys = NumberSpec(default=field("ys"), help="""
    The y-coordinates for all the patches, given as a "list of lists".

    .. note::
        Individual patches may comprise multiple polygons. In this case
        the y-coordinates for each polygon should be separated by NaN
        values in the sublists.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the patches.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the patches.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the patches.
    """)

class Quad(LineGlyph, FillGlyph, HatchGlyph):
    ''' Render axis-aligned quads.

    '''

    __example__ = "examples/reference/models/Quad.py"

    _args = ('left', 'right', 'top', 'bottom')

    left = NumberSpec(default=field("left"), help="""
    The x-coordinates of the left edges.
    """)

    right = NumberSpec(default=field("right"), help="""
    The x-coordinates of the right edges.
    """)

    bottom = NumberSpec(default=field("bottom"), help="""
    The y-coordinates of the bottom edges.
    """)

    top = NumberSpec(default=field("top"), help="""
    The y-coordinates of the top edges.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the quads.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the quads.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the quads.
    """)

class Quadratic(LineGlyph):
    ''' Render parabolas.

    '''

    __example__ = "examples/reference/models/Quadratic.py"

    _args = ("x0", "y0", "x1", "y1", "cx", "cy")

    x0 = NumberSpec(default=field("x0"), help="""
    The x-coordinates of the starting points.
    """)

    y0 = NumberSpec(default=field("y0"), help="""
    The y-coordinates of the starting points.
    """)

    x1 = NumberSpec(default=field("x1"), help="""
    The x-coordinates of the ending points.
    """)

    y1 = NumberSpec(default=field("y1"), help="""
    The y-coordinates of the ending points.
    """)

    cx = NumberSpec(default=field("cx"), help="""
    The x-coordinates of the control points.
    """)

    cy = NumberSpec(default=field("cy"), help="""
    The y-coordinates of the control points.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the parabolas.
    """)

class Ray(XYGlyph, LineGlyph):
    ''' Render rays.

    '''

    __example__ = "examples/reference/models/Ray.py"

    _args = ('x', 'y', 'length', 'angle')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates to start the rays.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates to start the rays.
    """)

    angle = AngleSpec(default=0, help="""
    The angles in radians to extend the rays, as measured from the horizontal.
    """)

    length = DistanceSpec(default=0, help="""
    The length to extend the ray. Note that this ``length`` defaults
    to |data units| (measured in the x-direction).
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the rays.
    """)

class Rect(XYGlyph, LineGlyph, FillGlyph, HatchGlyph):
    ''' Render rectangles.

    '''

    __example__ = "examples/reference/models/Rect.py"

    _args = ('x', 'y', 'width', 'height', 'angle', 'dilate')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates of the centers of the rectangles.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates of the centers of the rectangles.
    """)

    width = DistanceSpec(default=field("width"), help="""
    The overall widths of the rectangles.
    """)

    height = DistanceSpec(default=field("height"), help="""
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

    line_props = Include(LineProps, help="""
    The {prop} values for the rectangles.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the rectangles.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the rectangles.
    """)

class Scatter(Marker):
    ''' Render scatter markers selected from a predefined list of designs.

    Use ``Scatter`` to draw any of Bokeh's built-in marker types:
    ``asterisk``, ``circle``, ``circle_cross``, ``circle_dot``, ``circle_x``,
    ``circle_y``, ``cross``, ``dash``, ``diamond``, ``diamond_cross``,
    ``diamond_dot``, ``dot``, ``hex``, ``hex_dot``, ``inverted_triangle``,
    ``plus``, ``square``, ``square_cross``, ``square_dot``, ``square_pin``,
    ``square_x``, ``star``, ``star_dot``, ``triangle``, ``triangle_dot``,
    ``triangle_pin``, ``x``, or ``y``. This collection is available in
    :class:`~bokeh.core.enums.MarkerType`.

    Bokeh's built-in markers consist of a set of base markers, most of which can
    be combined with different kinds of additional visual features:

    .. bokeh-plot:: docs/user_guide/examples/plotting_markertypes.py
        :source-position: none

    You can select marker types in two ways:

    * To draw the **same marker for all values**, use the ``marker`` attribute
      to specify the name of a specific marker. For example:

      .. code-block:: python

          glyph = Scatter(x="x", y="y", size="sizes", marker="square")
          plot.add_glyph(source, glyph)

      This will render square markers for all points.

    * Alternatively, to use **marker types specified in a data source column**,
      assign the column name to the ``marker`` attribute. For example:

      .. code-block:: python

          # source.data['markers'] = ["circle", "square", "circle", ... ]

          glyph = Scatter(x="x", y="y", size="sizes", marker="markers")
          plot.add_glyph(source, glyph)

    .. note::
        When you draw ``circle`` markers with ``Scatter``, you can only assign a
        size in |screen units| (by passing a number of pixels to the ``size``
        property). In case you want to define the radius of circles in
        |data units|, use the :class:`~bokeh.models.glyphs.Circle` glyph instead
        of the ``Scatter`` glyph.

    '''

    __example__ = "examples/reference/models/Scatter.py"

    _args = ('x', 'y', 'size', 'angle', 'marker')

    marker = MarkerSpec(default="circle", help="""
    Which marker to render. This can be the name of any built in marker,
    e.g. "circle", or a reference to a data column containing such names.
    """)

class Segment(LineGlyph):
    ''' Render segments.

    '''

    __example__ = "examples/reference/models/Segment.py"

    _args = ('x0', 'y0', 'x1', 'y1')

    x0 = NumberSpec(default=field("x0"), help="""
    The x-coordinates of the starting points.
    """)

    y0 = NumberSpec(default=field("y0"), help="""
    The y-coordinates of the starting points.
    """)

    x1 = NumberSpec(default=field("x1"), help="""
    The x-coordinates of the ending points.
    """)

    y1 = NumberSpec(default=field("y1"), help="""
    The y-coordinates of the ending points.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the segments.
    """)

class Step(XYGlyph, LineGlyph):
    ''' Render step lines.

    Step levels can be draw before, after, or centered on each point, according
    to the value of the ``mode`` property.

    The x-coordinates are assumed to be (and must be) sorted in ascending order
    for steps to be properly rendered.

    '''

    __example__ = "examples/reference/models/Step.py"

    _args = ('x', 'y')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates for the steps.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates for the steps.
    """)

    line_props = Include(ScalarLineProps, help="""
    The {prop} values for the steps.
    """)

    mode = Enum(StepMode, default="before", help="""
    Where the step "level" should be drawn in relation to the x and y
    coordinates. The parameter can assume one of three values:

    * ``before``: (default) Draw step levels before each x-coordinate (no step before the first point)
    * ``after``:  Draw step levels after each x-coordinate (no step after the last point)
    * ``center``: Draw step levels centered on each x-coordinate
    """)

class Text(XYGlyph, TextGlyph):
    ''' Render text.

    '''

    __example__ = "examples/reference/models/Text.py"

    _args = ('x', 'y', 'text', 'angle', 'x_offset', 'y_offset')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates to locate the text anchors.
    """)

    y = NumberSpec(default=field("y"), help="""
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
    distance in |screen units| from a given data position.
    """)

    y_offset = NumberSpec(default=0, help="""
    Offset values to apply to the y-coordinates.

    This is useful, for instance, if it is desired to "float" text a fixed
    distance in |screen units| from a given data position.
    """)

    text_props = Include(TextProps, help="""
    The {prop} values for the text.
    """)

class VArea(FillGlyph, HatchGlyph):
    ''' Render a vertically directed area between two equal length sequences
    of y-coordinates with the same x-coordinates.

    '''

    __example__ = "examples/reference/models/VArea.py"

    _args = ('x', 'y1', 'y2')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates for the points of the area.
    """)

    y1 = NumberSpec(default=field("y1"), help="""
    The y-coordinates for the points of one side of the area.
    """)

    y2 = NumberSpec(default=field("y2"), help="""
    The y-coordinates for the points of the other side of the area.
    """)

    fill_props = Include(ScalarFillProps, help="""
    The {prop} values for the vertical directed area.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the vertical directed area.
    """)

class VBar(LineGlyph, FillGlyph, HatchGlyph):
    ''' Render vertical bars, given a center coordinate, width and (top, bottom) coordinates.

    '''

    __example__ = "examples/reference/models/VBar.py"

    _args = ('x', 'width', 'top', 'bottom')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates of the centers of the vertical bars.
    """)

    width = NumberSpec(default=1, help="""
    The widths of the vertical bars.
    """)

    bottom = NumberSpec(default=0, help="""
    The y-coordinates of the bottom edges.
    """)

    top = NumberSpec(default=field("top"), help="""
    The y-coordinates of the top edges.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the vertical bars.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the vertical bars.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the vertical bars.
    """)

class Wedge(XYGlyph, LineGlyph, FillGlyph, HatchGlyph):
    ''' Render wedges.

    '''

    __example__ = "examples/reference/models/Wedge.py"

    _args = ('x', 'y', 'radius', 'start_angle', 'end_angle', 'direction')

    x = NumberSpec(default=field("x"), help="""
    The x-coordinates of the points of the wedges.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-coordinates of the points of the wedges.
    """)

    radius = DistanceSpec(default=field("radius"), help="""
    Radii of the wedges.
    """)

    start_angle = AngleSpec(default=field("start_angle"), help="""
    The angles to start the wedges, as measured from the horizontal.
    """)

    end_angle = AngleSpec(default=field("end_angle"), help="""
    The angles to end the wedges, as measured from the horizontal.
    """)

    direction = Enum(Direction, default='anticlock', help="""
    Which direction to stroke between the start and end angles.
    """)

    line_props = Include(LineProps, help="""
    The {prop} values for the wedges.
    """)

    fill_props = Include(FillProps, help="""
    The {prop} values for the wedges.
    """)

    hatch_props = Include(HatchProps, help="""
    The {prop} values for the wedges.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
