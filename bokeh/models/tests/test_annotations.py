from __future__ import  absolute_import

from bokeh.models.annotations import Legend, BoxAnnotation, Span
from bokeh.enums import (
    NamedColor as Color, LineJoin, LineCap, FontStyle, TextAlign,
    TextBaseline)

FILL = ["fill_color", "fill_alpha"]
BACKGROUND = ['background_fill_color', 'background_fill_alpha']
BORDER = ["border_line_color", "border_line_width", "border_line_alpha",
    "border_line_join", "border_line_cap", "border_line_dash",
    "border_line_dash_offset"]
LINE = ["line_color", "line_width", "line_alpha", "line_join", "line_cap",
    "line_dash", "line_dash_offset"]
LABEL = ["label_text_font", "label_text_font_size", "label_text_font_style",
    "label_text_color", "label_text_alpha", "label_text_align",
    "label_text_baseline"]
PROPS = ["name", "tags"]

def check_border(annotation):
    assert annotation.border_line_color == Color.black
    assert annotation.border_line_width == 1
    assert annotation.border_line_alpha == 1.0
    assert annotation.border_line_join == LineJoin.miter
    assert annotation.border_line_cap == LineCap.butt
    assert annotation.border_line_dash == []
    assert annotation.border_line_dash_offset == 0

def check_label(annotation):
    assert annotation.label_text_font == "Helvetica"
    assert annotation.label_text_font_size == {"value": "10pt"}
    assert annotation.label_text_font_style == FontStyle.normal
    assert annotation.label_text_color == "#444444"
    assert annotation.label_text_alpha == 1.0
    assert annotation.label_text_align == TextAlign.left
    assert annotation.label_text_baseline == TextBaseline.middle

def check_props(annotation, *props):
    expected = set(sum((PROPS,) + props, []))
    found = set(annotation.properties())
    missing = expected.difference(found)
    extra = found.difference(expected)
    assert len(missing) == 0, "Properties missing: {0}".format(", ".join(sorted(missing)))
    assert len(extra) == 0, "Extra properties: {0}".format(", ".join(sorted(extra)))

def check_fill(annotation):
    assert annotation.fill_color == '#fff9ba'
    assert annotation.fill_alpha == 0.4

def check_background(annotation):
    assert annotation.background_fill_color == '#ffffff'
    assert annotation.background_fill_alpha == 1.0

def check_line(annotation, line_color='#cccccc', line_width=0.3, line_alpha=1.0):
    assert annotation.line_color == line_color
    assert annotation.line_width == line_width
    assert annotation.line_alpha == line_alpha
    assert annotation.line_join == LineJoin.miter
    assert annotation.line_cap == LineCap.butt
    assert annotation.line_dash == []
    assert annotation.line_dash_offset == 0

def test_Legend():
    legend = Legend()
    assert legend.plot is None
    assert legend.orientation == 'top_right'
    assert legend.label_standoff == 15
    assert legend.label_height == 20
    assert legend.label_width == 50
    assert legend.glyph_height == 20
    assert legend.glyph_width == 20
    assert legend.legend_padding == 10
    assert legend.legend_spacing == 3
    assert legend.legends == []
    yield check_border, legend
    yield check_label, legend
    yield check_background, legend
    yield (check_props, legend, [
        "plot",
        "orientation",
        "label_standoff",
        "label_height",
        "label_width",
        "glyph_height",
        "glyph_width",
        "legend_padding",
        "legend_spacing",
        "legends"
    ], LABEL, BORDER, BACKGROUND)

def test_BoxAnnotation():
    box = BoxAnnotation()
    assert box.plot is None
    assert box.left == None
    assert box.left_units == 'data'
    assert box.right == None
    assert box.right_units == 'data'
    assert box.bottom == None
    assert box.bottom_units == 'data'
    assert box.top == None
    assert box.top_units == 'data'
    assert box.x_range_name == 'default'
    assert box.y_range_name == 'default'
    assert box.level == 'annotation'
    yield check_line, box, '#cccccc', 1, 0.3
    yield check_fill, box
    yield (check_props, box, [
        "plot",
        "left",
        "left_units",
        "right",
        "right_units",
        "bottom",
        "bottom_units",
        "top",
        "top_units",
        "x_range_name",
        "y_range_name",
        "level",
    ], LINE, FILL)

def test_Span():
    line = Span()
    assert line.plot is None
    assert line.location is None
    assert line.location_units == 'data'
    assert line.dimension == 'width'
    assert line.x_range_name == 'default'
    assert line.y_range_name == 'default'
    assert line.level == 'annotation'
    assert line.render_mode == 'canvas'
    yield check_line, line, 'black', 1.0
    yield (check_props, line, [
        "plot",
        "location",
        "location_units",
        "dimension",
        "x_range_name",
        "y_range_name",
        "level",
        "render_mode"
    ], LINE)
