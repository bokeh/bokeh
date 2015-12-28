from __future__ import absolute_import

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

from bokeh.core.enums import (
    LineJoin, LineDash, LineCap,
    FontStyle,
    TextAlign, TextBaseline,
    Direction,
    Units, AngleUnits, DatetimeUnits,
    Dimension,
    Anchor, Location, LegendLocation,
    DashPattern,
    ButtonType, MapType,
    NamedColor as Color, NamedIcon)

# fool flake8
(   LineJoin, LineDash, LineCap,
    FontStyle,
    TextAlign, TextBaseline,
    Direction,
    Units, AngleUnits, DatetimeUnits,
    Dimension,
    Anchor, Location, LegendLocation,
    DashPattern,
    ButtonType, MapType,
    Color, NamedIcon)

FILL = ["fill_color", "fill_alpha"]
LINE = ["line_color", "line_width", "line_alpha", "line_join", "line_cap", "line_dash", "line_dash_offset"]
TEXT = ["text_font", "text_font_size", "text_font_style", "text_color", "text_alpha", "text_align", "text_baseline"]

PROPS = ["name", "tags"]
GLYPH = ["visible"]
MARKER = ["x", "y", "size", "angle", "angle_units"]

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
    assert glyph.line_width == 1
    assert glyph.line_alpha == 1.0
    assert glyph.line_join == LineJoin.miter
    assert glyph.line_cap == LineCap.butt
    assert glyph.line_dash == []
    assert glyph.line_dash_offset == 0

def check_text(glyph):
    assert glyph.text_font == "helvetica"
    assert glyph.text_font_size == {"value": "12pt"}
    assert glyph.text_font_style == FontStyle.normal
    assert glyph.text_color == "#444444"
    assert glyph.text_alpha == 1.0
    assert glyph.text_align == TextAlign.left
    assert glyph.text_baseline == TextBaseline.bottom

def check_marker(marker):
    assert marker.x is None
    assert marker.y is None
    assert marker.size == 4

def test_AnnularWedge():
    glyph = AnnularWedge()
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.inner_radius is None
    assert glyph.outer_radius is None
    assert glyph.start_angle is None
    assert glyph.end_angle is None
    assert glyph.direction == "anticlock"
    yield check_fill, glyph
    yield check_line, glyph
    yield (check_props, glyph, [
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
    ], FILL, LINE)

def test_Annulus():
    glyph = Annulus()
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.inner_radius is None
    assert glyph.outer_radius is None
    yield check_fill, glyph
    yield check_line, glyph
    yield (check_props, glyph, [
        "x",
        "y",
        "inner_radius",
        "inner_radius_units",
        "outer_radius",
        "outer_radius_units",
    ], FILL, LINE)

def test_Arc():
    glyph = Arc()
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.radius is None
    assert glyph.start_angle is None
    assert glyph.end_angle is None
    assert glyph.direction == "anticlock"
    yield check_line, glyph
    yield (check_props, glyph, [
        "x",
        "y",
        "radius",
        "radius_units",
        "start_angle",
        "start_angle_units",
        "end_angle",
        "end_angle_units",
        "direction",
    ], LINE)

def test_Bezier():
    glyph = Bezier()
    assert glyph.x0 is None
    assert glyph.y0 is None
    assert glyph.x1 is None
    assert glyph.y1 is None
    assert glyph.cx0 is None
    assert glyph.cy0 is None
    assert glyph.cx1 is None
    assert glyph.cy1 is None
    yield check_line, glyph
    yield (check_props, glyph, [
        "x0",
        "y0",
        "x1",
        "y1",
        "cx0",
        "cy0",
        "cx1",
        "cy1",
    ], LINE)

def test_Gear():
    glyph = Gear()
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.angle == 0
    assert glyph.module is None
    assert glyph.teeth is None
    assert glyph.pressure_angle == 20
    assert glyph.shaft_size == 0.3
    assert glyph.internal == False
    yield check_fill, glyph
    yield check_line, glyph
    yield (check_props, glyph, [
        "x",
        "y",
        "angle",
        "angle_units",
        "module",
        "teeth",
        "pressure_angle",
        "shaft_size",
        "internal",
    ], FILL, LINE)

def test_Image():
    glyph = Image()
    assert glyph.image is None
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.dw is None
    assert glyph.dh is None
    assert glyph.dilate == False
    yield (check_props, glyph, [
        "image",
        "x",
        "y",
        "dw",
        "dw_units",
        "dh",
        "dh_units",
        "dilate",
        "color_mapper",
    ])

def test_ImageRGBA():
    glyph = ImageRGBA()
    assert glyph.image is None
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.dw is None
    assert glyph.dh is None
    assert glyph.rows == None
    assert glyph.cols == None
    assert glyph.dilate == False
    yield (check_props, glyph, [
        "image",
        "x",
        "y",
        "dw",
        "dw_units",
        "dh",
        "dh_units",
        "rows",
        "cols",
        "dilate",
    ])

def test_ImageURL():
    glyph = ImageURL()
    assert glyph.url is None
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.w is None
    assert glyph.h is None
    assert glyph.angle == 0
    assert glyph.dilate == False
    assert glyph.anchor == Anchor.top_left
    assert glyph.retry_attempts == 0
    assert glyph.retry_timeout == 0
    assert glyph.global_alpha == 1.0
    yield (check_props, glyph, [
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
    ])

def test_Line():
    glyph = Line()
    assert glyph.x is None
    assert glyph.y is None
    yield check_line, glyph
    yield (check_props, glyph, [
        "x",
        "y",
    ], LINE)

def test_MultiLine():
    glyph = MultiLine()
    assert glyph.xs is None
    assert glyph.ys is None
    yield check_line, glyph
    yield (check_props, glyph, [
        "xs",
        "ys",
    ], LINE)

def test_Oval():
    glyph = Oval()
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.width is None
    assert glyph.height is None
    assert glyph.angle == 0
    yield check_fill, glyph
    yield check_line, glyph
    yield (check_props, glyph, [
        "x",
        "y",
        "width",
        "width_units",
        "height",
        "height_units",
        "angle",
        "angle_units",
    ], FILL, LINE)

def test_Patch():
    glyph = Patch()
    assert glyph.x is None
    assert glyph.y is None
    yield check_fill, glyph
    yield check_line, glyph
    yield (check_props, glyph, [
        "x",
        "y",
    ], FILL, LINE)

def test_Patches():
    glyph = Patches()
    assert glyph.xs is None
    assert glyph.ys is None
    yield check_fill, glyph
    yield check_line, glyph
    yield (check_props, glyph, [
        "xs",
        "ys",
    ], FILL, LINE)

def test_Quad():
    glyph = Quad()
    assert glyph.left is None
    assert glyph.right is None
    assert glyph.bottom is None
    assert glyph.top is None
    yield check_fill, glyph
    yield check_line, glyph
    yield (check_props, glyph, [
        "left",
        "right",
        "bottom",
        "top",
    ], FILL, LINE)

def test_Quadratic():
    glyph = Quadratic()
    assert glyph.x0 is None
    assert glyph.y0 is None
    assert glyph.x1 is None
    assert glyph.y1 is None
    assert glyph.cx is None
    assert glyph.cy is None
    yield check_line, glyph
    yield (check_props, glyph, [
        "x0",
        "y0",
        "x1",
        "y1",
        "cx",
        "cy",
    ], LINE)

def test_Ray():
    glyph = Ray()
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.angle is None
    assert glyph.length is None
    yield check_line, glyph
    yield (check_props, glyph, [
        "x",
        "y",
        "angle",
        "angle_units",
        "length",
        "length_units",
    ], LINE)

def test_Rect():
    glyph = Rect()
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.width is None
    assert glyph.height is None
    assert glyph.angle == 0
    assert glyph.dilate == False
    yield check_fill, glyph
    yield check_line, glyph
    yield (check_props, glyph, [
        "x",
        "y",
        "width",
        "width_units",
        "height",
        "height_units",
        "angle",
        "angle_units",
        "dilate",
    ], FILL, LINE)

def test_Segment():
    glyph = Segment()
    assert glyph.x0 is None
    assert glyph.y0 is None
    assert glyph.x1 is None
    assert glyph.y1 is None
    yield check_line, glyph
    yield (check_props, glyph, [
        "x0",
        "y0",
        "x1",
        "y1"
    ], LINE)

def test_Text():
    glyph = Text()
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.text == "text"
    assert glyph.angle == 0
    yield check_text, glyph
    yield (check_props, glyph, [
        "x",
        "y",
        "text",
        "angle",
        "angle_units",
        "x_offset",
        "y_offset"
    ], TEXT)

def test_Wedge():
    glyph = Wedge()
    assert glyph.x is None
    assert glyph.y is None
    assert glyph.radius is None
    assert glyph.start_angle is None
    assert glyph.end_angle is None
    assert glyph.direction == "anticlock"
    yield check_fill, glyph
    yield check_line, glyph
    yield (check_props, glyph, [
        "x",
        "y",
        "radius",
        "radius_units",
        "start_angle",
        "start_angle_units",
        "end_angle",
        "end_angle_units",
        "direction",
    ], FILL, LINE)

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
    yield (check_props, marker, [
        "radius",
        "radius_units",
        "radius_dimension",
    ], MARKER, FILL, LINE)

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
    yield check_marker, marker
    yield check_fill, marker
    yield check_line, marker
    yield check_props, marker, MARKER, FILL, LINE

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
