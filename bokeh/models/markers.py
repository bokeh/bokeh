''' Display a variety of simple scatter marker shapes whose attributes
can be associated with data columns from ``ColumnDataSources``.

The full list of markers built into Bokeh is given below:

* :class:`~bokeh.models.markers.Asterisk`
* :class:`~bokeh.models.markers.Circle`
* :class:`~bokeh.models.markers.CircleCross`
* :class:`~bokeh.models.markers.CircleX`
* :class:`~bokeh.models.markers.Cross`
* :class:`~bokeh.models.markers.Diamond`
* :class:`~bokeh.models.markers.DiamondCross`
* :class:`~bokeh.models.markers.InvertedTriangle`
* :class:`~bokeh.models.markers.Square`
* :class:`~bokeh.models.markers.SquareCross`
* :class:`~bokeh.models.markers.SquareX`
* :class:`~bokeh.models.markers.Triangle`
* :class:`~bokeh.models.markers.X`

Markers are all subclasses of ``Glyph``. Additionally, they all share the
same common interface providing fill and line properties provided by their
base class ``Marker``. Note that a few glyphs, ``Cross`` and ``X``, only
draw lines. For these the fill property values are ignored. Also note that
the ``Circle`` glyph has some additional properties such as ``radius`` that
other markers do not.

.. autoclass:: Marker
    :members:

'''
from __future__ import absolute_import

from ..core.enums import enumeration
from ..core.has_props import abstract
from ..core.properties import AngleSpec, DistanceSpec, Enum, Include, NumberSpec, ScreenDistanceSpec
from ..core.property_mixins import FillProps, LineProps

from .glyphs import Glyph

@abstract
class Marker(Glyph):
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

    x = NumberSpec(help="""
    The x-axis coordinates for the center of the markers.
    """)

    y = NumberSpec(help="""
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

class Asterisk(Marker):
    ''' Render asterisk '*' markers. '''

    __example__ = "tests/glyphs/Asterisk.py"


class Circle(Marker):
    ''' Render circle markers. '''

    __example__ = "tests/glyphs/Circle.py"

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

    radius_dimension = Enum(enumeration('x', 'y'), help="""
    What dimension to measure circle radii along.

    When the data space aspect ratio is not 1-1, then the size of the drawn
    circles depends on what direction is used to measure the "distance" of
    the radius. This property allows that direction to be controlled.
    """)

class CircleCross(Marker):
    ''' Render circle markers with a '+' cross through the center. '''

    __example__ = "tests/glyphs/CircleCross.py"

class CircleX(Marker):
    ''' Render circle markers with an 'X' cross through the center. '''

    __example__ = "tests/glyphs/CircleX.py"

class Cross(Marker):
    ''' Render '+' cross markers. '''

    __example__ = "tests/glyphs/Cross.py"

class Diamond(Marker):
    ''' Render diamond markers. '''

    __example__ = "tests/glyphs/Diamond.py"

class DiamondCross(Marker):
    ''' Render diamond markers with a '+' cross through the center. '''

    __example__ = "tests/glyphs/DiamondCross.py"


class InvertedTriangle(Marker):
    ''' Render upside-down triangle markers. '''

    __example__ = "tests/glyphs/InvertedTriangle.py"

class Square(Marker):
    ''' Render a square marker, optionally rotated. '''

    __example__ = "tests/glyphs/Square.py"

class SquareCross(Marker):
    ''' Render square markers with a '+' cross through the center. '''

    __example__ = "tests/glyphs/SquareCross.py"

class SquareX(Marker):
    ''' Render square markers with an 'X' cross through the center. '''

    __example__ = "tests/glyphs/SquareX.py"

class Triangle(Marker):
    ''' Render triangle markers. '''

    __example__ = "tests/glyphs/Triangle.py"

class X(Marker):
    ''' Render a 'X' cross markers. '''

    __example__ = "tests/glyphs/X.py"
