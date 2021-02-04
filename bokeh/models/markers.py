#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Display a variety of simple scatter marker shapes whose attributes
can be associated with data columns from
:class:`~bokeh.models.sources.ColumnDataSource` objects.

.. note::
    The individual marker classes in this module are **deprecated since Bokeh
    2.3.0.** Please replace all occurrences of ``Marker`` models with
    :class:`~bokeh.models.glyphs.Scatter` glyphs. For example: instead of
    ``Asterisk()``, use ``Scatter(marker="asterisk")``.

    For backwards compatibility, all markers in this module currently link to
    their respective replacements using the
    :class:`~bokeh.models.glyphs.Scatter` glyph.

The full list of markers accessible through this module:

* :func:`~bokeh.models.markers.Asterisk`
* :class:`~bokeh.models.markers.Circle`
* :func:`~bokeh.models.markers.CircleCross`
* :func:`~bokeh.models.markers.CircleDot`
* :func:`~bokeh.models.markers.CircleY`
* :func:`~bokeh.models.markers.CircleX`
* :func:`~bokeh.models.markers.Cross`
* :func:`~bokeh.models.markers.Dash`
* :func:`~bokeh.models.markers.Diamond`
* :func:`~bokeh.models.markers.DiamondCross`
* :func:`~bokeh.models.markers.DiamondDot`
* :func:`~bokeh.models.markers.Dot`
* :func:`~bokeh.models.markers.Hex`
* :func:`~bokeh.models.markers.HexDot`
* :func:`~bokeh.models.markers.InvertedTriangle`
* :func:`~bokeh.models.markers.Plus`
* :func:`~bokeh.models.markers.Square`
* :func:`~bokeh.models.markers.SquareCross`
* :func:`~bokeh.models.markers.SquareDot`
* :func:`~bokeh.models.markers.SquarePin`
* :func:`~bokeh.models.markers.SquareX`
* :func:`~bokeh.models.markers.Star`
* :func:`~bokeh.models.markers.StarDot`
* :func:`~bokeh.models.markers.Triangle`
* :func:`~bokeh.models.markers.TriangleDot`
* :func:`~bokeh.models.markers.TrianglePin`
* :func:`~bokeh.models.markers.X`
* :func:`~bokeh.models.markers.Y`

By definition, all markers accept the following set of properties:

* ``x``, ``y`` position
* ``size`` in pixels
* ``line``, ``fill``, and ``hatch`` properties
* ``angle``

The ``asterisk``, ``cross``, ``dash`, ``dot``, ``x``, and ``y`` are rendered as
lines. Therefore, those markers ignore any values that are passed to the
``fill`` and ``hatch`` properties.

.. note::
    When you draw ``circle`` markers with ``Scatter``, you can only assign a
    size in :ref:`screen units <userguide_styling_units>` (by passing a
    number of pixels to the ``size`` argument). In case you want to define
    the radius of circles in :ref:`data units <userguide_styling_units>`,
    use the :class:`~bokeh.models.glyphs.Circle` glyph instead of the
    ``Scatter`` glyph with a ``circle`` marker.

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
from ..util.deprecation import deprecated
from . import glyphs
from .glyphs import Circle, Marker, Scatter

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
    'Star',
    'StarDot',
    'Triangle',
    'TriangleDot',
    'TrianglePin',
    'X',
    'Y',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def Asterisk(*args, **kwargs):
    ''' Render asterisk '*' markers. (deprecated) '''
    deprecated((2, 3, 0), "Asterisk()", "Scatter(marker='asterisk')")
    return Scatter(*args, **kwargs, marker="asterisk")

def CircleCross(*args, **kwargs):
    ''' Render circle markers with a '+' cross through the center. (deprecated) '''
    deprecated((2, 3, 0), "CircleCross()", "Scatter(marker='circle_cross')")
    return Scatter(*args, **kwargs, marker="circle_cross")

def CircleDot(*args, **kwargs):
    ''' Render circle markers with center dots. (deprecated) '''
    deprecated((2, 3, 0), "CircleDot()", "Scatter(marker='circle_dot')")
    return Scatter(*args, **kwargs, marker="circle_dot")

def CircleX(*args, **kwargs):
    ''' Render circle markers with an 'X' cross through the center. (deprecated) '''
    deprecated((2, 3, 0), "CircleX()", "Scatter(marker='circle_x')")
    return Scatter(*args, **kwargs, marker="circle_x")

def CircleY(*args, **kwargs):
    ''' Render circle markers with an 'Y' cross through the center. (deprecated) '''
    deprecated((2, 3, 0), "CircleY()", "Scatter(marker='circle_y')")
    return Scatter(*args, **kwargs, marker="circle_y")

def Cross(*args, **kwargs):
    ''' Render '+' cross markers. (deprecated) '''
    deprecated((2, 3, 0), "Cross()", "Scatter(marker='cross')")
    return Scatter(*args, **kwargs, marker="cross")

def Dash(*args, **kwargs):
    ''' Render dash markers. (deprecated) '''
    deprecated((2, 3, 0), "Dash()", "Scatter(marker='dash')")
    return Scatter(*args, **kwargs, marker="dash")

def Diamond(*args, **kwargs):
    ''' Render diamond markers. (deprecated) '''
    deprecated((2, 3, 0), "Diamond()", "Scatter(marker='diamond')")
    return Scatter(*args, **kwargs, marker="diamond")

def DiamondCross(*args, **kwargs):
    ''' Render diamond markers with a '+' cross through the center. (deprecated) '''
    deprecated((2, 3, 0), "DiamondCross()", "Scatter(marker='diamond_cross')")
    return Scatter(*args, **kwargs, marker="diamond_cross")

def DiamondDot(*args, **kwargs):
    ''' Render diamond markers with center dots. (deprecated) '''
    deprecated((2, 3, 0), "DiamondDot()", "Scatter(marker='diamond_dot')")
    return Scatter(*args, **kwargs, marker="diamond_dot")

def Dot(*args, **kwargs):
    ''' Render dots (one-quarter radius circles). (deprecated) '''
    deprecated((2, 3, 0), "Dot()", "Scatter(marker='dot')")
    return Scatter(*args, **kwargs, marker="dot")

def Hex(*args, **kwargs):
    ''' Render hexagon markers. (deprecated) '''
    deprecated((2, 3, 0), "Hex()", "Scatter(marker='hex')")
    return Scatter(*args, **kwargs, marker="hex")

def HexDot(*args, **kwargs):
    ''' Render hexagon markers with center dots. (deprecated) '''
    deprecated((2, 3, 0), "HexDot()", "Scatter(marker='hex_dot')")
    return Scatter(*args, **kwargs, marker="hex_dot")

def InvertedTriangle(*args, **kwargs):
    ''' Render upside-down triangle markers. (deprecated) '''
    deprecated((2, 3, 0), "InvertedTriangle()", "Scatter(marker='inverted_triangle')")
    return Scatter(*args, **kwargs, marker="inverted_triangle")

def Plus(*args, **kwargs):
    ''' Render filled plus markers '''
    deprecated((2, 3, 0), "Plut()", "Scatter(marker='plus')")
    return Scatter(*args, **kwargs, marker="plus")

def Square(*args, **kwargs):
    ''' Render square markers. (deprecated) '''
    deprecated((2, 3, 0), "Square()", "Scatter(marker='square')")
    return Scatter(*args, **kwargs, marker="square")

def SquareDot(*args, **kwargs):
    ''' Render square markers with center dots. (deprecated) '''
    deprecated((2, 3, 0), "SquareDot()", "Scatter(marker='square_dot')")
    return Scatter(*args, **kwargs, marker="square_dot")

def SquarePin(*args, **kwargs):
    ''' Render pin-cushion square markers. (deprecated) '''
    deprecated((2, 3, 0), "SquarePin()", "Scatter(marker='square_pin')")
    return Scatter(*args, **kwargs, marker="square_pin")

def SquareCross(*args, **kwargs):
    ''' Render square markers with a '+' cross through the center. (deprecated) '''
    deprecated((2, 3, 0), "SquareCross()", "Scatter(marker='square_cross')")
    return Scatter(*args, **kwargs, marker="square_cross")

def SquareX(*args, **kwargs):
    ''' Render square markers with an 'X' cross through the center. (deprecated) '''
    deprecated((2, 3, 0), "SquareX()", "Scatter(marker='square_x')")
    return Scatter(*args, **kwargs, marker="square_x")

def Star(*args, **kwargs):
    ''' Render star markers. (deprecated) '''
    deprecated((2, 3, 0), "Star()", "Scatter(marker='star')")
    return Scatter(*args, **kwargs, marker="star")

def StarDot(*args, **kwargs):
    ''' Render star markers with center dots. (deprecated) '''
    deprecated((2, 3, 0), "StarDot()", "Scatter(marker='star_dot')")
    return Scatter(*args, **kwargs, marker="star_dot")

def Triangle(*args, **kwargs):
    ''' Render triangle markers. (deprecated) '''
    deprecated((2, 3, 0), "Triangle()", "Scatter(marker='triangle')")
    return Scatter(*args, **kwargs, marker="triangle")

def TriangleDot(*args, **kwargs):
    ''' Render triangle markers with center dots. (deprecated) '''
    deprecated((2, 3, 0), "TriangleDot()", "Scatter(marker='triangle_dot')")
    return Scatter(*args, **kwargs, marker="triangle_dot")

def TrianglePin(*args, **kwargs):
    ''' Render pin-cushion triangle markers. (deprecated) '''
    deprecated((2, 3, 0), "TrianglePin()", "Scatter(marker='triangle_pin')")
    return Scatter(*args, **kwargs, marker="triangle_pin")

def X(*args, **kwargs):
    ''' Render 'X' markers. (deprecated) '''
    deprecated((2, 3, 0), "X()", "Scatter(marker='x')")
    return Scatter(*args, **kwargs, marker="x")

def Y(*args, **kwargs):
    ''' Render 'Y' markers. (deprecated) '''
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
    "star": Star,
    "star_dot": StarDot,
    "triangle": Triangle,
    "triangle_dot": TriangleDot,
    "triangle_pin": TrianglePin,
    "x": X,
    "y": Y,
}

glyphs.Asterisk = Asterisk
glyphs.CircleCross = CircleCross
glyphs.CircleDot = CircleDot
glyphs.CircleY = CircleY
glyphs.CircleX = CircleX
glyphs.Cross = Cross
glyphs.Dash = Dash
glyphs.Diamond = Diamond
glyphs.DiamondCross = DiamondCross
glyphs.DiamondDot = DiamondDot
glyphs.Dot = Dot
glyphs.Hex = Hex
glyphs.HexDot = HexDot
glyphs.InvertedTriangle = InvertedTriangle
glyphs.Plus = Plus
glyphs.Square = Square
glyphs.SquareCross = SquareCross
glyphs.SquareDot = SquareDot
glyphs.SquarePin = SquarePin
glyphs.SquareX = SquareX
glyphs.Star = Star
glyphs.StarDot = StarDot
glyphs.Triangle = Triangle
glyphs.TriangleDot = TriangleDot
glyphs.TrianglePin = TrianglePin
glyphs.X = X
glyphs.Y = Y
