""" Glyph renderer models for displaying simple scatter-type
markers on Bokeh plots.

"""
from __future__ import absolute_import

from .glyphs import Glyph
from ..mixins import FillProps, LineProps
from ..properties import DataSpec, Include

class Marker(Glyph):
    """ Base class for glyphs that are simple markers with line and
    fill properties, located at an (x, y) location with a specified
    size.

    """

    x = DataSpec("x", help="""
    The x-axis coordinates for the center of the markers.
    """)

    y = DataSpec("y", help="""
    The y-axis coordinates for the center of the markers.
    """)

    size = DataSpec(units="screen", min_value=0, default=4, help="""
    The size (diameter) values for the markers. Interpreted as
    "screen space" units by default.
    """)

    line_props = Include(LineProps, use_prefix=False, help="""
    The %s values for the markers.
    """)

    fill_props = Include(FillProps, use_prefix=False, help="""
    The %s values for the markers.
    """)

class Asterisk(Marker):
    """

    """

class Circle(Marker):
    """

    """

    radius = DataSpec(units="data", min_value=0, default=None, help="""
    The radius values for circle markers. Interpreted in
    "data space" units by default.

    .. note::
        Circle markers are slightly unusual in that they support specifying
        a radius in addition to a size. Only one of ``radius`` or ``size``
        should be given.

    .. warning::
        Note that Cicle glyphs are always drawn as circles on the screen,
        even in cases where the data space aspect ratio is not 1-1. In all
        cases where radius or size units are specified as "data", the
        "distance" for the radius is measured along the horizontal axis.
        If the aspect ratio is very large or small, the drawn circles may
        appear much larger or smaller than expected. See :bokeh-issue:`626`
        for more information.

    """)

class CircleCross(Marker):
    """

    """

class CircleX(Marker):
    """

    """

class Cross(Marker):
    """

    """

class Diamond(Marker):
    """

    """

class DiamondCross(Marker):
    """

    """

class InvertedTriangle(Marker):
    """

    """

class Square(Marker):
    """

    """

    angle = DataSpec("angle", help="""
    The angle (in radians) to rotate square markers.
    """)

class SquareCross(Marker):
    """

    """

class SquareX(Marker):
    """

    """

class Triangle(Marker):
    """

    """

class X(Marker):
    """

    """
