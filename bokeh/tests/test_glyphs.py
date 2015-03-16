from __future__ import absolute_import

import unittest

from bokeh.models.glyphs import (
    AnnularWedge, Annulus, Arc,
    Bezier,
    Circle,
    Gear,
    Image, ImageRGBA, ImageURL,
    Line,
    MultiLine,
    Oval,
    Patch, Patches,
    Quad, Quadratic, Ray,
    Rect,
    Segment,
    Text,
    Wedge)

from bokeh.models.glyphs import (
    Asterisk,
    CircleCross, CircleX, Cross,
    Diamond, DiamondCross,
    InvertedTriangle,
    Square, SquareCross, SquareX,
    Triangle,
    X)

from bokeh.enums import (
    LineJoin, LineDash, LineCap,
    FontStyle,
    TextAlign, TextBaseline,
    Direction,
    Units, AngleUnits, DatetimeUnits,
    Dimension,
    Anchor, Location, Orientation,
    DashPattern,
    ButtonType, MapType,
    NamedColor as Color, NamedIcon)

FILL = ["fill_color", "fill_alpha"]
LINE = ["line_color", "line_width", "line_alpha", "line_join", "line_cap", "line_dash", "line_dash_offset"]
TEXT = ["text_font", "text_font_size", "text_font_style", "text_color", "text_alpha", "text_align", "text_baseline"]

PROPS = ["session", "name", "tags"]
GLYPH = ["visible"]
MARKER = ["x", "y", "size"]

def check_props(glyph, *props):
    expected = set(sum((PROPS, GLYPH) + props, []))
    found = set(glyph.properties())
    missing = expected.difference(found)
    extra = found.difference(expected)
    assert len(missing) == 0, "Properties missing: {0}".format(", ".join(sorted(missing)))
    assert len(extra) == 0, "Extra properties: {0}".format(", ".join(sorted(extra)))

def check_fill(glyph):
    assert glyph.fill_color == Color.gray
    assert glyph.fill_alpha == 1.0

def check_line(glyph):
    assert glyph.line_color == Color.black
    assert glyph.line_width == "line_width"
    assert glyph.line_alpha == 1.0
    assert glyph.line_join == LineJoin.miter
    assert glyph.line_cap == LineCap.butt
    assert glyph.line_dash == []
    assert glyph.line_dash_offset == 0

def check_text(glyph):
    assert glyph.text_font == "Helvetica"
    assert glyph.text_font_size == "12pt"
    assert glyph.text_font_style == FontStyle.normal
    assert glyph.text_color == "#444444"
    assert glyph.text_alpha == 1.0
    assert glyph.text_align == TextAlign.left
    assert glyph.text_baseline == TextBaseline.bottom

def check_marker(marker):
    assert marker.x == "x"
    assert marker.y == "y"
    assert marker.size == 4

def test_AnnularWedge():
    glyph = AnnularWedge()
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.inner_radius == None
    assert glyph.outer_radius == None
    assert glyph.start_angle == "start_angle"
    assert glyph.end_angle == "end_angle"
    assert glyph.direction == "clock"
    yield check_fill, glyph
    yield check_line, glyph
    yield check_props, glyph, ["x", "y", "inner_radius", "outer_radius", "start_angle", "end_angle", "direction"], FILL, LINE

def test_Annulus():
    glyph = Annulus()
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.inner_radius == None
    assert glyph.outer_radius == None
    yield check_fill, glyph
    yield check_line, glyph
    yield check_props, glyph, ["x", "y", "inner_radius", "outer_radius"], FILL, LINE

def test_Arc():
    glyph = Arc()
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.radius == None
    assert glyph.start_angle == "start_angle"
    assert glyph.end_angle == "end_angle"
    assert glyph.direction == "clock"
    yield check_line, glyph
    yield check_props, glyph, ["x", "y", "radius", "start_angle", "end_angle", "direction"], LINE

def test_Bezier():
    glyph = Bezier()
    assert glyph.x0 == "x0"
    assert glyph.y0 == "y0"
    assert glyph.x1 == "x1"
    assert glyph.y1 == "y1"
    assert glyph.cx0 == "cx0"
    assert glyph.cy0 == "cy0"
    assert glyph.cx1 == "cx1"
    assert glyph.cy1 == "cy1"
    yield check_line, glyph
    yield check_props, glyph, ["x0", "y0", "x1", "y1", "cx0", "cy0", "cx1", "cy1"], LINE

def test_Gear():
    glyph = Gear()
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.angle == 0
    assert glyph.module == "module"
    assert glyph.teeth == "teeth"
    assert glyph.pressure_angle == 20
    assert glyph.shaft_size == 0.3
    assert glyph.internal == False
    yield check_fill, glyph
    yield check_line, glyph
    yield check_props, glyph, ["x", "y", "angle", "module", "teeth", "pressure_angle", "shaft_size", "internal"], FILL, LINE

def test_Image():
    glyph = Image()
    assert glyph.image == "image"
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.dw == "dw"
    assert glyph.dh == "dh"
    assert glyph.dilate == False
    yield check_props, glyph, ["image", "x", "y", "dw", "dh", "dilate", "color_mapper"]

def test_ImageRGBA():
    glyph = ImageRGBA()
    assert glyph.image == "image"
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.dw == "dw"
    assert glyph.dh == "dh"
    assert glyph.rows == "rows"
    assert glyph.cols == "cols"
    assert glyph.dilate == False
    yield check_props, glyph, ["image", "x", "y", "dw", "dh", "rows", "cols", "dilate"]

def test_ImageURL():
    glyph = ImageURL()
    assert glyph.url == "url"
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.w == "w"
    assert glyph.h == "h"
    assert glyph.angle == 0
    assert glyph.dilate == False
    assert glyph.anchor == Anchor.top_left
    yield check_props, glyph, ["url", "x", "y", "w", "h", "angle", "dilate", "anchor"]

def test_Line():
    glyph = Line()
    assert glyph.x == "x"
    assert glyph.y == "y"
    yield check_line, glyph
    yield check_props, glyph, ["x", "y"], LINE

def test_MultiLine():
    glyph = MultiLine()
    assert glyph.xs == "xs"
    assert glyph.ys == "ys"
    yield check_line, glyph
    yield check_props, glyph, ["xs", "ys"], LINE

def test_Oval():
    glyph = Oval()
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.width == "width"
    assert glyph.height == "height"
    assert glyph.angle == "angle"
    yield check_fill, glyph
    yield check_line, glyph
    yield check_props, glyph, ["x", "y", "width", "height", "angle"], FILL, LINE

def test_Patch():
    glyph = Patch()
    assert glyph.x == "x"
    assert glyph.y == "y"
    yield check_fill, glyph
    yield check_line, glyph
    yield check_props, glyph, ["x", "y"], FILL, LINE

def test_Patches():
    glyph = Patches()
    assert glyph.xs == "xs"
    assert glyph.ys == "ys"
    yield check_fill, glyph
    yield check_line, glyph
    yield check_props, glyph, ["xs", "ys"], FILL, LINE

def test_Quad():
    glyph = Quad()
    assert glyph.left == "left"
    assert glyph.right == "right"
    assert glyph.bottom == "bottom"
    assert glyph.top == "top"
    yield check_fill, glyph
    yield check_line, glyph
    yield check_props, glyph, ["left", "right", "bottom", "top"], FILL, LINE

def test_Quadratic():
    glyph = Quadratic()
    assert glyph.x0 == "x0"
    assert glyph.y0 == "y0"
    assert glyph.x1 == "x1"
    assert glyph.y1 == "y1"
    assert glyph.cx == "cx"
    assert glyph.cy == "cy"
    yield check_line, glyph
    yield check_props, glyph, ["x0", "y0", "x1", "y1", "cx", "cy"], LINE

def test_Ray():
    glyph = Ray()
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.angle == "angle"
    assert glyph.length == None
    yield check_line, glyph
    yield check_props, glyph, ["x", "y", "angle", "length"], LINE

def test_Rect():
    glyph = Rect()
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.width == "width"
    assert glyph.height == "height"
    assert glyph.angle == "angle"
    assert glyph.dilate == False
    yield check_fill, glyph
    yield check_line, glyph
    yield check_props, glyph, ["x", "y", "width", "height", "angle", "dilate"], FILL, LINE

def test_Segment():
    glyph = Segment()
    assert glyph.x0 == "x0"
    assert glyph.y0 == "y0"
    assert glyph.x1 == "x1"
    assert glyph.y1 == "y1"
    yield check_line, glyph
    yield check_props, glyph, ["x0", "y0", "x1", "y1"], LINE

def test_Text():
    glyph = Text()
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.text == "text"
    assert glyph.angle == 0
    yield check_text, glyph
    yield check_props, glyph, ["x", "y", "text", "angle", "x_offset", "y_offset"], TEXT

def test_Wedge():
    glyph = Wedge()
    assert glyph.x == "x"
    assert glyph.y == "y"
    assert glyph.radius == None
    assert glyph.start_angle == "start_angle"
    assert glyph.end_angle == "end_angle"
    assert glyph.direction == "clock"
    yield check_fill, glyph
    yield check_line, glyph
    yield check_props, glyph, ["x", "y", "radius", "start_angle", "end_angle", "direction"], FILL, LINE

def test_Asterisk():
    marker = Asterisk()
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE

def test_Circle():
    marker = Circle()
    yield check_marker, marker
    assert marker.radius == None
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, ["radius", "radius_dimension"], MARKER, FILL, LINE

def test_CircleCross():
    marker = CircleCross()
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE

def test_CircleX():
    marker = CircleX()
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE

def test_Cross():
    marker = Cross()
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE

def test_Diamond():
    marker = Diamond()
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE

def test_DiamondCross():
    marker = DiamondCross()
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE

def test_InvertedTriangle():
    marker = InvertedTriangle()
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE

def test_Square():
    marker = Square()
    assert marker.angle == "angle"
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, ["angle"], MARKER, FILL, LINE

def test_SquareCross():
    marker = SquareCross()
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE

def test_SquareX():
    marker = SquareX()
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE

def test_Triangle():
    marker = Triangle()
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE

def test_X():
    marker = X()
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE
