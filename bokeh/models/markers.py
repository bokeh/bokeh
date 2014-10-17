from __future__ import absolute_import

from .glyphs import Glyph
from ..mixins import FillProps, LineProps
from ..properties import DataSpec

class Marker(Glyph, FillProps, LineProps):
    """ Base class for glyphs which are just simple markers placed at (x,y)
    locations.
    """

    x = DataSpec
    y = DataSpec
    size = DataSpec(units="screen", min_value=0, default=4)

class Asterisk(Marker):
    pass

class Circle(Marker):
    radius = DataSpec(units="data", min_value=0)

class CircleCross(Marker):
    pass

class CircleX(Marker):
    pass

class Cross(Marker):
    pass

class Diamond(Marker):
    pass

class DiamondCross(Marker):
    pass

class InvertedTriangle(Marker):
    pass

class Square(Marker):
    angle = DataSpec

class SquareCross(Marker):
    pass

class SquareX(Marker):
    pass

class Triangle(Marker):
    pass

class X(Marker):
    pass
