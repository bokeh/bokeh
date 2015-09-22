""" Glyph renderer models for displaying simple scatter-type
markers on Bokeh plots.

"""
from __future__ import absolute_import

from .glyphs import Glyph
from ..enums import enumeration
from ..mixins import FillProps, LineProps
from ..properties import abstract
from ..properties import DistanceSpec, Enum, Include, NumberSpec, ScreenDistanceSpec

@abstract
class Marker(Glyph):
    """ Base class for glyphs that are simple markers with line and
    fill properties, located at an (x, y) location with a specified
    size.

    .. note::
        For simplicity, all markers have both line and fill properties
        declared, however some markers (`Asterisk`, `Cross`, `X`) only
        draw lines. For these markers, the fill values are simply
        ignored.

    """

    x = NumberSpec("x", help="""
    The x-axis coordinates for the center of the markers.
    """)

    y = NumberSpec("y", help="""
    The y-axis coordinates for the center of the markers.
    """)

    size = ScreenDistanceSpec(default=4, help="""
    The size (diameter) values for the markers. Interpreted as
    "screen space" units by default.
    """)

    angle = NumberSpec("angle", help="""
    The angles to rotate the markers.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the markers.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the markers.
    """)

class Asterisk(Marker):
    """ Render asterisk '*' markers.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Asterisk.py
        :source-position: none

    *source:* ``tests/glyphs/Asterisk.py``

    """

class Circle(Marker):
    """ Render circle markers.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Circle.py
        :source-position: none

    *source:* ``tests/glyphs/Circle.py``

    """

    radius = DistanceSpec("radius", help="""
    The radius values for circle markers. Interpreted in
    "data space" units by default.

    .. note::
        Circle markers are slightly unusual in that they support specifying
        a radius in addition to a size. Only one of ``radius`` or ``size``
        should be given.

    .. warning::
        Note that ``Circle`` glyphs are always drawn as circles on the screen,
        even in cases where the data space aspect ratio is not 1-1. In all
        cases where radius or size units are specified as "data", the
        "distance" for the radius is measured along the horizontal axis.
        If the aspect ratio is very large or small, the drawn circles may
        appear much larger or smaller than expected. See :bokeh-issue:`626`
        for more information.

    """)

    radius_dimension = Enum(enumeration('x', 'y'), help="""
    What dimension to measure circle radii along.

    When the data space aspect ratio is not 1-1, then the size of the drawn
    circles depends on what direction is used to measure the "distance" of
    the radius. This property allows that direction to be controlled.
    """)

class CircleCross(Marker):
    """ Render circle markers with a '+' cross through the center.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/CircleCross.py
        :source-position: none

    *source:* ``tests/glyphs/CircleCross.py``

    """

class CircleX(Marker):
    """ Render circle markers with an 'X' cross through the center.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/CircleX.py
        :source-position: none

    *source:* ``tests/glyphs/CircleX.py``

    """

class Cross(Marker):
    """ Render '+' cross markers.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Cross.py
        :source-position: none

    *source:* ``tests/glyphs/Cross.py``

    """

class Diamond(Marker):
    """ Render diamond markers.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Diamond.py
        :source-position: none

    *source:* ``tests/glyphs/Diamond.py``

    """

class DiamondCross(Marker):
    """ Render diamond markers with a '+' cross through the center.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/DiamondCross.py
        :source-position: none

    *source:* ``tests/glyphs/DiamondCross.py``

    """

class InvertedTriangle(Marker):
    """ Render upside-down triangle markers.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/InvertedTriangle.py
        :source-position: none

    *source:* ``tests/glyphs/InvertedTriangle.py``

    """

class Square(Marker):
    """ Render a square marker, optionally rotated.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Square.py
        :source-position: none

    *source:* ``tests/glyphs/Square.py``

    """

class SquareCross(Marker):
    """ Render square markers with a '+' cross through the center.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/SquareCross.py
        :source-position: none

    *source:* ``tests/glyphs/SquareCross.py``

    """

class SquareX(Marker):
    """ Render square markers with an 'X' cross through the center.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/SquareX.py
        :source-position: none

    *source:* ``tests/glyphs/SquareX.py``

    """

class Triangle(Marker):
    """ Render triangle markers.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/Triangle.py
        :source-position: none

    *source:* ``tests/glyphs/Triangle.py``

    """

class X(Marker):
    """ Render a 'X' cross markers.

    Example
    -------

    .. bokeh-plot:: ../tests/glyphs/X.py
        :source-position: none

    *source:* ``tests/glyphs/X.py``

    """
