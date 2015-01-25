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
    """ Render asterisk '*' markers.

    """

class Circle(Marker):
    """ Render circle markers.

    """

    radius = DataSpec(units="data", min_value=0, default=None, help="""
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

class CircleCross(Marker):
    """ Render circle markers with a '+' cross through the center.

    """

class CircleX(Marker):
    """ Render circle markers with an 'X' cross through the center.

    """

class Cross(Marker):
    """ Render '+' cross markers.

    """

class Diamond(Marker):
    """ Render diamond markers.

    """

class DiamondCross(Marker):
    """ Render diamond markers with a '+' cross through the center.

    """

class InvertedTriangle(Marker):
    """ Render upside-down triangle markers.

    """

class Square(Marker):
    """ Render a square marker, optionally rotated.

    """

    angle = DataSpec("angle", help="""
    The angles (in radians) to rotate square markers.
    """)

class SquareCross(Marker):
    """ Render square markers with a '+' cross through the center.

    """

class SquareX(Marker):
    """ Render square markers with an 'X' cross through the center.

    """

class Triangle(Marker):
    """ Render triangle markers.

    """

class X(Marker):
    """ Render a 'X' cross markers.

    """
