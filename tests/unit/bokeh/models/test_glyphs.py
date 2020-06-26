#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from _util_models import (
    FILL,
    GLYPH,
    HATCH,
    LINE,
    MARKER,
    TEXT,
    check_fill_properties,
    check_hatch_properties,
    check_line_properties,
    check_marker_properties,
    check_properties_existence,
    check_text_properties,
)
from bokeh.core.enums import (
    Anchor,
    AngleUnits,
    ButtonType,
    DashPattern,
    Dimension,
    Direction,
    FontStyle,
    LegendLocation,
    LineCap,
    LineDash,
    LineJoin,
    Location,
    MapType,
)
from bokeh.core.enums import NamedColor as Color
from bokeh.core.enums import TextAlign, TextBaseline
from bokeh.core.property.dataspec import field
from bokeh.models.glyphs import (
    Asterisk,
    CircleCross,
    CircleX,
    Cross,
    Dash,
    Diamond,
    DiamondCross,
    InvertedTriangle,
    Square,
    SquareCross,
    SquareX,
    Triangle,
    X,
)

# Module under test
from bokeh.models.glyphs import ( # isort:skip
    AnnularWedge, Annulus, Arc,
    Bezier,
    Circle,
    HArea,
    HBar,
    Image, ImageRGBA, ImageURL,
    Line,
    MultiLine,
    MultiPolygons,
    Oval,
    Patch, Patches,
    Quad, Quadratic, Ray,
    Rect,
    Segment,
    Step,
    Text,
    VArea,
    VBar,
    Wedge)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------


# fool flake8
(LineJoin, LineDash, LineCap, FontStyle, TextAlign, TextBaseline, Direction,
 AngleUnits, Dimension, Anchor, Location, LegendLocation,
 DashPattern, ButtonType, MapType, Color)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_AnnularWedge() -> None:
    glyph = AnnularWedge()
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.inner_radius is None
    assert glyph.outer_radius is None
    assert glyph.start_angle is None
    assert glyph.end_angle is None
    assert glyph.direction == "anticlock"
    check_fill_properties(glyph)
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y",
        "inner_radius",
        "inner_radius_units",
        "outer_radius",
        "outer_radius_units",
        "start_angle",
        "start_angle_units",
        "end_angle",
        "end_angle_units",
        "direction",
    ], FILL, LINE, GLYPH)


def test_Annulus() -> None:
    glyph = Annulus()
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.inner_radius is None
    assert glyph.outer_radius is None
    check_fill_properties(glyph)
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y",
        "inner_radius",
        "inner_radius_units",
        "outer_radius",
        "outer_radius_units",
    ], FILL, LINE, GLYPH)


def test_Arc() -> None:
    glyph = Arc()
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.radius is None
    assert glyph.start_angle is None
    assert glyph.end_angle is None
    assert glyph.direction == "anticlock"
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y",
        "radius",
        "radius_units",
        "start_angle",
        "start_angle_units",
        "end_angle",
        "end_angle_units",
        "direction",
    ], LINE, GLYPH)


def test_Bezier() -> None:
    glyph = Bezier()
    assert glyph.x0 == field("x0")
    assert glyph.y0 == field("y0")
    assert glyph.x1 == field("x1")
    assert glyph.y1 == field("y1")
    assert glyph.cx0 == field("cx0")
    assert glyph.cy0 == field("cy0")
    assert glyph.cx1 == field("cx1")
    assert glyph.cy1 == field("cy1")
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x0",
        "y0",
        "x1",
        "y1",
        "cx0",
        "cy0",
        "cx1",
        "cy1",
    ], LINE, GLYPH)


def test_HArea() -> None:
    glyph = HArea()
    assert glyph.y == field("y")
    assert glyph.x1 == field("x1")
    assert glyph.x2 == field("x2")
    check_fill_properties(glyph)
    check_hatch_properties(glyph)
    check_properties_existence(glyph, [
        "y",
        "x1",
        "x2",
    ], FILL, HATCH, GLYPH)


def test_HBar() -> None:
    glyph = HBar()
    assert glyph.y == field("y")
    assert glyph.height is None
    assert glyph.left == 0
    assert glyph.right is None
    check_fill_properties(glyph)
    check_hatch_properties(glyph)
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "y",
        "height",
        "left",
        "right",
    ], FILL, HATCH, LINE, GLYPH)


def test_Image() -> None:
    glyph = Image()
    assert glyph.image is None
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.dw is None
    assert glyph.dh is None
    assert glyph.dilate is False
    check_properties_existence(glyph, [
        "image",
        "x",
        "y",
        "dw",
        "dw_units",
        "dh",
        "dh_units",
        "global_alpha",
        "dilate",
        "color_mapper",
    ], GLYPH)


def test_ImageRGBA() -> None:
    glyph = ImageRGBA()
    assert glyph.image is None
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.dw is None
    assert glyph.dh is None
    assert glyph.dilate is False
    check_properties_existence(glyph, [
        "image",
        "x",
        "y",
        "dw",
        "dw_units",
        "dh",
        "dh_units",
        "global_alpha",
        "dilate",
    ], GLYPH)


def test_ImageURL() -> None:
    glyph = ImageURL()
    assert glyph.url is None
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.w is None
    assert glyph.h is None
    assert glyph.angle == 0
    assert glyph.dilate is False
    assert glyph.anchor == Anchor.top_left
    assert glyph.retry_attempts == 0
    assert glyph.retry_timeout == 0
    assert glyph.global_alpha == 1.0
    check_properties_existence(glyph, [
        "url",
        "x",
        "y",
        "w",
        "w_units",
        "h",
        "h_units",
        "angle",
        "angle_units",
        "dilate",
        "anchor",
        "retry_attempts",
        "retry_timeout",
        "global_alpha",
    ], GLYPH)


def test_Line() -> None:
    glyph = Line()
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y",
    ], LINE, GLYPH)


def test_MultiLine() -> None:
    glyph = MultiLine()
    assert glyph.xs == field("xs")
    assert glyph.ys == field("ys")
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "xs",
        "ys",
    ], LINE, GLYPH)


def test_MultiPolygons() -> None:
    glyph = MultiPolygons()
    assert glyph.xs == field("xs")
    assert glyph.ys == field("ys")
    check_fill_properties(glyph)
    check_hatch_properties(glyph)
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "xs",
        "ys",
    ], FILL, HATCH, LINE, GLYPH)


def test_Oval() -> None:
    glyph = Oval()
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.width is None
    assert glyph.height is None
    assert glyph.angle == 0
    check_fill_properties(glyph)
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y",
        "width",
        "width_units",
        "height",
        "height_units",
        "angle",
        "angle_units",
    ], FILL, LINE, GLYPH)


def test_Patch() -> None:
    glyph = Patch()
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    check_fill_properties(glyph)
    check_hatch_properties(glyph)
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y",
    ], FILL, HATCH, LINE, GLYPH)


def test_Patches() -> None:
    glyph = Patches()
    assert glyph.xs == field("xs")
    assert glyph.ys == field("ys")
    check_fill_properties(glyph)
    check_hatch_properties(glyph)
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "xs",
        "ys",
    ], FILL, HATCH, LINE, GLYPH)


def test_Quad() -> None:
    glyph = Quad()
    assert glyph.left is None
    assert glyph.right is None
    assert glyph.bottom is None
    assert glyph.top is None
    check_fill_properties(glyph)
    check_hatch_properties(glyph)
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "left",
        "right",
        "bottom",
        "top",
    ], FILL, HATCH, LINE, GLYPH)


def test_Quadratic() -> None:
    glyph = Quadratic()
    assert glyph.x0 == field("x0")
    assert glyph.y0 == field("y0")
    assert glyph.x1 == field("x1")
    assert glyph.y1 == field("y1")
    assert glyph.cx == field("cx")
    assert glyph.cy == field("cy")
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x0",
        "y0",
        "x1",
        "y1",
        "cx",
        "cy",
    ], LINE, GLYPH)


def test_Ray() -> None:
    glyph = Ray()
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.angle is None
    assert glyph.length is None
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y",
        "angle",
        "angle_units",
        "length",
        "length_units",
    ], LINE, GLYPH)


def test_Rect() -> None:
    glyph = Rect()
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.width is None
    assert glyph.height is None
    assert glyph.angle == 0
    assert glyph.dilate is False
    check_fill_properties(glyph)
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y",
        "width",
        "width_units",
        "height",
        "height_units",
        "angle",
        "angle_units",
        "dilate",
    ], FILL, LINE, GLYPH)


def test_Segment() -> None:
    glyph = Segment()
    assert glyph.x0 == field("x0")
    assert glyph.y0 == field("y0")
    assert glyph.x1 == field("x1")
    assert glyph.y1 == field("y1")
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x0",
        "y0",
        "x1",
        "y1"
    ], LINE, GLYPH)


def test_Step() -> None:
    glyph = Step()
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.mode == "before"
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y",
        "mode",
    ], LINE, GLYPH)


def test_Text() -> None:
    glyph = Text()
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.text == "text"
    assert glyph.angle == 0
    check_text_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y",
        "text",
        "angle",
        "angle_units",
        "x_offset",
        "y_offset"
    ], TEXT, GLYPH)


def test_VArea() -> None:
    glyph = VArea()
    assert glyph.x == field("x")
    assert glyph.y1 == field("y1")
    assert glyph.y2 == field("y2")
    check_fill_properties(glyph)
    check_hatch_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y1",
        "y2",
    ], FILL, HATCH, GLYPH)


def test_VBar() -> None:
    glyph = VBar()
    assert glyph.x == field("x")
    assert glyph.width is None
    assert glyph.top is None
    assert glyph.bottom == 0
    check_fill_properties(glyph)
    check_hatch_properties(glyph)
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "width",
        "top",
        "bottom",
    ], FILL, HATCH, LINE, GLYPH)


def test_Wedge() -> None:
    glyph = Wedge()
    assert glyph.x == field("x")
    assert glyph.y == field("y")
    assert glyph.radius is None
    assert glyph.start_angle is None
    assert glyph.end_angle is None
    assert glyph.direction == "anticlock"
    check_fill_properties(glyph)
    check_line_properties(glyph)
    check_properties_existence(glyph, [
        "x",
        "y",
        "radius",
        "radius_units",
        "start_angle",
        "start_angle_units",
        "end_angle",
        "end_angle_units",
        "direction",
    ], FILL, LINE, GLYPH)


def test_Asterisk() -> None:
    marker = Asterisk()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_Circle() -> None:
    marker = Circle()
    check_marker_properties(marker)
    assert marker.radius is None
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, [
        "radius",
        "radius_units",
        "radius_dimension",
    ], MARKER, FILL, LINE, GLYPH)


def test_CircleCross() -> None:
    marker = CircleCross()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_CircleX() -> None:
    marker = CircleX()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_Cross() -> None:
    marker = Cross()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_Dash() -> None:
    marker = Dash()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_Diamond() -> None:
    marker = Diamond()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_DiamondCross() -> None:
    marker = DiamondCross()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_InvertedTriangle() -> None:
    marker = InvertedTriangle()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_Square() -> None:
    marker = Square()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_SquareCross() -> None:
    marker = SquareCross()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_SquareX() -> None:
    marker = SquareX()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_Triangle() -> None:
    marker = Triangle()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)


def test_X() -> None:
    marker = X()
    check_marker_properties(marker)
    check_fill_properties(marker)
    check_line_properties(marker)
    check_properties_existence(marker, MARKER, FILL, LINE, GLYPH)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
