from bokeh.models.guides import Legend

from .utils.property_utils import (
    FILL, LINE, TEXT, prefix,
    check_properties_existence, check_fill_properties,
    check_line_properties, check_text_properties
)

def test_Legend():
    legend = Legend()
    assert legend.plot is None
    assert legend.location == 'top_right'
    assert legend.label_standoff == 5
    assert legend.label_height == 20
    assert legend.label_width == 20
    assert legend.glyph_height == 20
    assert legend.glyph_width == 20
    assert legend.legend_padding == 10
    assert legend.legend_spacing == 3
    assert legend.legends == []
    yield check_line_properties, legend, "border_", "#e5e5e5", 1.0, 0.5
    yield check_text_properties, legend, "label_", "10pt", "middle"
    yield check_fill_properties, legend, "background_", "#ffffff", 0.95
    yield (check_properties_existence, legend, [
        "plot",
        "location",
        "orientation",
        "label_standoff",
        "label_height",
        "label_width",
        "glyph_height",
        "glyph_width",
        "legend_margin",
        "legend_padding",
        "legend_spacing",
        "legends",
        "level"],
        prefix('label_', TEXT),
        prefix('border_', LINE),
        prefix('background_', FILL))
