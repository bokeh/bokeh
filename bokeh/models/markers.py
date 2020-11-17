#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Display a variety of simple scatter marker shapes whose attributes
can be associated with data columns from ``ColumnDataSources``.

The full list of markers built into Bokeh is given below:

* :class:`~bokeh.models.markers.Asterisk`
* :class:`~bokeh.models.markers.Circle`
* :class:`~bokeh.models.markers.CircleCross`
* :class:`~bokeh.models.markers.CircleDot`
* :class:`~bokeh.models.markers.CircleY`
* :class:`~bokeh.models.markers.CircleX`
* :class:`~bokeh.models.markers.Cross`
* :class:`~bokeh.models.markers.Dash`
* :class:`~bokeh.models.markers.Diamond`
* :class:`~bokeh.models.markers.DiamondCross`
* :class:`~bokeh.models.markers.DiamondDot`
* :class:`~bokeh.models.markers.Dot`
* :class:`~bokeh.models.markers.Hex`
* :class:`~bokeh.models.markers.HexDot`
* :class:`~bokeh.models.markers.InvertedTriangle`
* :class:`~bokeh.models.markers.Plus`
* :class:`~bokeh.models.markers.Square`
* :class:`~bokeh.models.markers.SquareCross`
* :class:`~bokeh.models.markers.SquareDot`
* :class:`~bokeh.models.markers.SquarePin`
* :class:`~bokeh.models.markers.SquareX`
* :class:`~bokeh.models.markers.Triangle`
* :class:`~bokeh.models.markers.TriangleDot`
* :class:`~bokeh.models.markers.TrianglePin`
* :class:`~bokeh.models.markers.X`
* :class:`~bokeh.models.markers.Y`

Markers are all subclasses of ``Glyph``. Additionally, they all share the
same common interface providing fill and line properties provided by their
base class ``Marker``. Note that a few glyphs, ``Cross`` and ``X``, only
draw lines. For these the fill property values are ignored. Also note that
the ``Circle`` glyph has some additional properties such as ``radius`` that
other markers do not.

.. autoclass:: Marker
    :members:

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.enums import enumeration
from ..core.has_props import abstract
from ..core.properties import (
    AngleSpec,
    DistanceSpec,
    Enum,
    Include,
    MarkerSpec,
    NumberSpec,
    ScreenDistanceSpec,
)
from ..core.property.dataspec import field
from ..core.property_mixins import FillProps, LineProps
from ..util.deprecation import deprecated
from .glyph import FillGlyph, LineGlyph, XYGlyph

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'Asterisk',
    'Circle',
    'CircleCross',
    'CircleDot',
    'CircleX',
    'CircleY',
    'Cross',
    'Dash',
    'Diamond',
    'DiamondCross',
    'DiamondDot',
    'Dot',
    'Hex',
    'HexDot',
    'InvertedTriangle',
    'Marker',
    'Plus',
    'Scatter',
    'Square',
    'SquareCross',
    'SquareDot',
    'SquarePin',
    'SquareX',
    'Triangle',
    'TriangleDot',
    'TrianglePin',
    'X',
    'Y',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class Marker(XYGlyph, LineGlyph, FillGlyph):
    ''' Base class for glyphs that are simple markers with line and
    fill properties, located at an (x, y) location with a specified
    size.

    .. note::
        For simplicity, all markers have both line and fill properties
        declared, however some markers (`Asterisk`, `Cross`, `X`) only
        draw lines. For these markers, the fill values are simply
        ignored.

    '''

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'size', 'angle')

    x = NumberSpec(default=field("x"), help="""
    The x-axis coordinates for the center of the markers.
    """)

    y = NumberSpec(default=field("y"), help="""
    The y-axis coordinates for the center of the markers.
    """)

    size = ScreenDistanceSpec(default=4, help="""
    The size (diameter) values for the markers in screen space units.
    """)

    angle = AngleSpec(default=0.0, help="""
    The angles to rotate the markers.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the markers.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the markers.
    """)

class Scatter(Marker):
    ''' Render arbitrary markers according a specification.

    The Scatter can draw any built-in marker type. It can be configured
    to draw the same marker for all values by specifying the name of a
    marker, e.g.

    .. code-block:: python

        glyph = Scatter(x="x", y="y", size="sizes", marker="square")
        plot.add_glyph(source, glyph)

    will render only Square markers for all points. Alternatively, the
    Scatter marker can be configured to use marker types specified in a
    data source column:

    .. code-block:: python

        # source.data['markers'] = ["circle", "square", "circle", ... ]

        glyph = Scatter(x="x", y="y", size="sizes", marker="markers")
        plot.add_glyph(source, glyph)

    Note that circles drawn with `Scatter` conform to the standard Marker
    interface, and can only vary by size (in screen units) and *not* by radius
    (in data units). If you need to control circles by radius in data units,
    you should use the Circle glyph directly.

    '''
    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y', 'size', 'angle', 'marker')

    marker = MarkerSpec(default="circle", help="""
    Which marker to render. This can be the name of any built in marker,
    e.g. "circle", or a reference to a data column containing such names.
    """)

    __example__ = "examples/reference/models/Scatter.py"

class Circle(Marker):
    ''' Render circle markers. '''

    __example__ = "examples/reference/models/Circle.py"

    # a canonical order for positional args that can be used for any
    # functions derived from this class
    _args = ('x', 'y')

    radius = DistanceSpec(None, help="""
    The radius values for circle markers (in "data space" units, by default).

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

def Asterisk(*args, **kwargs):
    ''' Render asterisk '*' markers. '''
    deprecated((2, 3, 0), "Asterisk()", "Scatter(marker='asterisk')")
    return Scatter(*args, **kwargs, marker="asterisk")

def CircleCross(*args, **kwargs):
    ''' Render circle markers with a '+' cross through the center. '''
    deprecated((2, 3, 0), "CircleCross()", "Scatter(marker='circle_cross')")
    return Scatter(*args, **kwargs, marker="circle_cross")

def CircleDot(*args, **kwargs):
    ''' Render circle markers with center dots. '''
    deprecated((2, 3, 0), "CircleDot()", "Scatter(marker='circle_dot')")
    return Scatter(*args, **kwargs, marker="circle_dot")

def CircleX(*args, **kwargs):
    ''' Render circle markers with an 'X' cross through the center. '''
    deprecated((2, 3, 0), "CircleX()", "Scatter(marker='circle_x')")
    return Scatter(*args, **kwargs, marker="circle_x")

def CircleY(*args, **kwargs):
    ''' Render circle markers with an 'Y' cross through the center. '''
    deprecated((2, 3, 0), "CircleY()", "Scatter(marker='circle_y')")
    return Scatter(*args, **kwargs, marker="circle_y")

def Cross(*args, **kwargs):
    ''' Render '+' cross markers. '''
    deprecated((2, 3, 0), "Cross()", "Scatter(marker='cross')")
    return Scatter(*args, **kwargs, marker="cross")

def Dash(*args, **kwargs):
    ''' Render dash markers. '''
    deprecated((2, 3, 0), "Dash()", "Scatter(marker='dash')")
    return Scatter(*args, **kwargs, marker="dash")

def Diamond(*args, **kwargs):
    ''' Render diamond markers. '''
    deprecated((2, 3, 0), "Diamond()", "Scatter(marker='diamond')")
    return Scatter(*args, **kwargs, marker="diamond")

def DiamondCross(*args, **kwargs):
    ''' Render diamond markers with a '+' cross through the center. '''
    deprecated((2, 3, 0), "DiamondCross()", "Scatter(marker='diamond_cross')")
    return Scatter(*args, **kwargs, marker="diamond_cross")

def DiamondDot(*args, **kwargs):
    ''' Render diamond markers with center dots. '''
    deprecated((2, 3, 0), "DiamondDot()", "Scatter(marker='diamond_dot')")
    return Scatter(*args, **kwargs, marker="diamond_dot")

def Dot(*args, **kwargs):
    ''' Render dots (one-quarter radius circles). '''
    deprecated((2, 3, 0), "Dot()", "Scatter(marker='dot')")
    return Scatter(*args, **kwargs, marker="dot")

def Hex(*args, **kwargs):
    ''' Render hexagon markers. '''
    deprecated((2, 3, 0), "Hex()", "Scatter(marker='hex')")
    return Scatter(*args, **kwargs, marker="hex")

def HexDot(*args, **kwargs):
    ''' Render hexagon markers with center dots. '''
    deprecated((2, 3, 0), "HexDot()", "Scatter(marker='hex_dot')")
    return Scatter(*args, **kwargs, marker="hex_dot")

def InvertedTriangle(*args, **kwargs):
    ''' Render upside-down triangle markers. '''
    deprecated((2, 3, 0), "InvertedTriangle()", "Scatter(marker='inverted_triangle')")
    return Scatter(*args, **kwargs, marker="inverted_triangle")

def Plus(*args, **kwargs):
    ''' Render filled plus markers '''
    deprecated((2, 3, 0), "Plut()", "Scatter(marker='plus')")
    return Scatter(*args, **kwargs, marker="plus")

def Square(*args, **kwargs):
    ''' Render square markers. '''
    deprecated((2, 3, 0), "Square()", "Scatter(marker='square')")
    return Scatter(*args, **kwargs, marker="square")

def SquareDot(*args, **kwargs):
    ''' Render square markers with center dots. '''
    deprecated((2, 3, 0), "SquareDot()", "Scatter(marker='square_dot')")
    return Scatter(*args, **kwargs, marker="square_dot")

def SquarePin(*args, **kwargs):
    ''' Render pin-cushion square markers. '''
    deprecated((2, 3, 0), "SquarePin()", "Scatter(marker='square_pin')")
    return Scatter(*args, **kwargs, marker="square_pin")

def SquareCross(*args, **kwargs):
    ''' Render square markers with a '+' cross through the center. '''
    deprecated((2, 3, 0), "SquareCross()", "Scatter(marker='square_cross')")
    return Scatter(*args, **kwargs, marker="square_cross")

def SquareX(*args, **kwargs):
    ''' Render square markers with an 'X' cross through the center. '''
    deprecated((2, 3, 0), "SquareX()", "Scatter(marker='square_x')")
    return Scatter(*args, **kwargs, marker="square_x")

def Triangle(*args, **kwargs):
    ''' Render triangle markers. '''
    deprecated((2, 3, 0), "Triangle()", "Scatter(marker='triangle')")
    return Scatter(*args, **kwargs, marker="triangle")

def TriangleDot(*args, **kwargs):
    ''' Render triangle markers with center dots. '''
    deprecated((2, 3, 0), "TriangleDot()", "Scatter(marker='triangle_dot')")
    return Scatter(*args, **kwargs, marker="triangle_dot")

def TrianglePin(*args, **kwargs):
    ''' Render pin-cushion triangle markers. '''
    deprecated((2, 3, 0), "TrianglePin()", "Scatter(marker='triangle_pin')")
    return Scatter(*args, **kwargs, marker="triangle_pin")

def X(*args, **kwargs):
    ''' Render 'X' markers. '''
    deprecated((2, 3, 0), "X()", "Scatter(marker='x')")
    return Scatter(*args, **kwargs, marker="x")

def Y(*args, **kwargs):
    ''' Render 'Y' markers. '''
    deprecated((2, 3, 0), "Y()", "Scatter(marker='y')")
    return Scatter(*args, **kwargs, marker="y")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

marker_types = {
    "asterisk": Asterisk,
    "circle": Circle,
    "circle_cross": CircleCross,
    "circle_dot": CircleDot,
    "circle_x": CircleX,
    "circle_y": CircleY,
    "cross": Cross,
    "dash": Dash,
    "diamond": Diamond,
    "diamond_cross": DiamondCross,
    "diamond_dot": DiamondDot,
    "dot": Dot,
    "hex": Hex,
    "hex_dot": HexDot,
    "inverted_triangle": InvertedTriangle,
    "plus": Plus,
    "square": Square,
    "square_cross": SquareCross,
    "square_dot": SquareDot,
    "square_pin": SquarePin,
    "square_x": SquareX,
    "triangle": Triangle,
    "triangle_dot": TriangleDot,
    "triangle_pin": TrianglePin,
    "x": X,
    "y": Y,
}
