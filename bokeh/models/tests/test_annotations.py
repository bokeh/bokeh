from __future__ import  absolute_import

from bokeh.models.annotations import Legend, BoxAnnotation, Label, Span
from bokeh.enums import (
    NamedColor as Color, LineJoin, LineCap, FontStyle, TextAlign,
    TextBaseline)

FILL_PROPS = ["fill_color", "fill_alpha"]
LINE_PROPS = ["line_color", "line_width", "line_alpha", "line_join", "line_cap",
    "line_dash", "line_dash_offset"]
TEXT_PROPS = ["text_font", "text_font_size", "text_font_style", "text_color",
    "text_alpha", "text_align", "text_baseline"]
PROPS = ["session", "name", "tags"]

def check_line_properties_defaults(annotation, prefix=None, line_color="#cccccc", line_width=1.0, line_alpha=1.0):
    if prefix is None:
        prefix = ''
    assert getattr(annotation, prefix + 'line_color') == line_color
    assert getattr(annotation, prefix + 'line_width') == line_width
    assert getattr(annotation, prefix + 'line_alpha') == line_alpha
    assert getattr(annotation, prefix + 'line_join') == LineJoin.miter
    assert getattr(annotation, prefix + 'line_cap') == LineCap.butt
    assert getattr(annotation, prefix + 'line_dash') == []
    assert getattr(annotation, prefix + 'line_dash_offset') == 0

def check_text_properties_defaults(annotation, prefix=None):
    if prefix is None:
        prefix = ''
    assert getattr(annotation, prefix + 'text_font') == "Helvetica"
    assert getattr(annotation, prefix + 'text_font_size') == dict(value="10pt")
    assert getattr(annotation, prefix + 'text_font_style') == FontStyle.normal
    assert getattr(annotation, prefix + 'text_color') == "#444444"
    assert getattr(annotation, prefix + 'text_alpha') == 1.0
    assert getattr(annotation, prefix + 'text_align') == TextAlign.left
    assert getattr(annotation, prefix + 'text_baseline') == TextBaseline.middle

def check_fill_properties_defaults(annotation, prefix=None, fill_color='#ffffff', fill_alpha=1.0):
    if prefix is None:
        prefix = ''
    assert getattr(annotation, prefix + 'fill_color') == fill_color
    assert getattr(annotation, prefix + 'fill_alpha') == fill_alpha

def check_correct_properties_present(annotation, *props):
    expected = set(sum((PROPS,) + props, []))
    found = set(annotation.properties())
    missing = expected.difference(found)
    extra = found.difference(expected)
    assert len(missing) == 0, "Properties missing: {0}".format(", ".join(sorted(missing)))
    assert len(extra) == 0, "Extra properties: {0}".format(", ".join(sorted(extra)))

def prefix(prop, prefix=None):
    if prefix is None:
        prefix = ''
    return [prefix + p for p in prop]

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
    yield check_line_properties_defaults, legend, 'border_', "black", 1.0
    yield check_text_properties_defaults, legend, 'label_'
    yield check_fill_properties_defaults, legend, 'background_'
    yield (check_correct_properties_present, legend, [
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
        ],
        prefix(LINE_PROPS, 'border_'),
        prefix(TEXT_PROPS, 'label_'),
        prefix(FILL_PROPS, 'background_')
        )

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
    yield check_line_properties_defaults, box, None, "#cccccc", 1.0, 0.3
    yield check_fill_properties_defaults, box, None, "#fff9ba", 0.4
    yield (check_correct_properties_present, box, [
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
        ],
        LINE_PROPS,
        FILL_PROPS
        )

def test_Label():
    label = Label()
    assert label.plot is None
    assert label.x is None
    assert label.x_offset is None
    assert label.x_units == 'data'
    assert label.y is None
    assert label.y_offset is None
    assert label.y_units == 'data'
    assert label.angle == 0
    assert label.angle_units == 'rad'
    assert label.x_range_name == 'default'
    assert label.y_range_name == 'default'
    assert label.level == 'annotation'
    yield check_line_properties_defaults, label, 'border_', "#cccccc", 1, 0.0
    yield check_text_properties_defaults, label, 'label_'
    yield check_fill_properties_defaults, label, 'background_', '#fff9ba', 0.0
    yield (check_correct_properties_present, label, [
            "plot",
            "x",
            "x_offset",
            "x_units",
            "y",
            "y_offset",
            "y_units",
            "text",
            "angle",
            "angle_units",
            "x_range_name",
            "y_range_name",
            "level",
        ],
        prefix(TEXT_PROPS, 'label_'),
        prefix(FILL_PROPS, 'background_'),
        prefix(LINE_PROPS, 'border_')
        )

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
    yield check_line_properties_defaults, line, None, 'black', 1.0
    yield (check_correct_properties_present, line, [
            "plot",
            "location",
            "location_units",
            "dimension",
            "x_range_name",
            "y_range_name",
            "level",
            "render_mode"
        ],
        LINE_PROPS
        )
