from __future__ import absolute_import
import mock
from datetime import datetime

from bokeh.core.properties import field, value
from bokeh.core.validation import check_integrity
from bokeh.models.annotations import (
    Legend, LegendItem, ColorBar, Arrow, BoxAnnotation, Span, LabelSet, Label,
    Title, Band, Whisker, Slope
)
from bokeh.models import (
    ColumnDataSource, ArrowHead, BasicTicker, BasicTickFormatter, GlyphRenderer
)

from .utils.property_utils import (
    FILL, LINE, TEXT, ANGLE, prefix,
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
    assert legend.padding == 10
    assert legend.spacing == 3
    assert legend.margin == 10
    assert legend.items == []
    check_line_properties(legend, "border_", "#e5e5e5", 1.0, 0.5)
    check_text_properties(legend, "label_", "10pt", "middle")
    check_fill_properties(legend, "background_", "#ffffff", 0.95)
    check_properties_existence(legend, [
        "plot",
        "visible",
        "location",
        "orientation",
        "label_standoff",
        "label_height",
        "label_width",
        "glyph_height",
        "glyph_width",
        "margin",
        "padding",
        "spacing",
        "items",
        "level",
        "click_policy"],
        prefix('label_', TEXT),
        prefix('border_', LINE),
        prefix('background_', FILL),
        prefix('inactive_', FILL))


def test_ColorBar():
    color_bar = ColorBar()
    assert color_bar.plot is None
    assert color_bar.location == 'top_right'
    assert color_bar.orientation == 'vertical'
    assert color_bar.height == 'auto'
    assert color_bar.width == 'auto'
    assert color_bar.scale_alpha == 1.0
    assert color_bar.title is None
    assert color_bar.title_standoff == 2
    assert isinstance(color_bar.ticker, BasicTicker)
    assert isinstance(color_bar.formatter, BasicTickFormatter)
    assert color_bar.color_mapper is None
    assert color_bar.margin == 30
    assert color_bar.padding == 10
    assert color_bar.label_standoff == 5
    assert color_bar.major_tick_in == 5
    assert color_bar.major_tick_out == 0
    assert color_bar.minor_tick_in == 0
    assert color_bar.minor_tick_out == 0
    check_text_properties(color_bar, "title_", "10pt", "bottom", "italic")
    check_text_properties(color_bar, "major_label_", "8pt", "middle", "normal", "center")
    check_line_properties(color_bar, "major_tick_", "#ffffff")
    check_line_properties(color_bar, "minor_tick_", None)
    check_line_properties(color_bar, "bar_", None)
    check_line_properties(color_bar, "border_", None)
    check_fill_properties(color_bar, "background_", "#ffffff", 0.95)
    check_properties_existence(color_bar, [
        "plot",
        "level",
        "visible",
        "location",
        "orientation",
        "height",
        "width",
        "scale_alpha",
        "title",
        "title_standoff",
        "ticker",
        "formatter",
        "color_mapper",
        "margin",
        "padding",
        "label_standoff",
        "major_tick_in",
        "major_tick_out",
        "minor_tick_in",
        "minor_tick_out",
        "major_label_overrides"],
        prefix('title_', TEXT),
        prefix('major_label_', TEXT),
        prefix('major_tick_', LINE),
        prefix('minor_tick_', LINE),
        prefix('bar_', LINE),
        prefix('border_', LINE),
        prefix('background_', FILL)
    )


def test_Arrow():
    arrow = Arrow()
    assert arrow.plot is None
    assert arrow.x_start is None
    assert arrow.y_start is None
    assert arrow.start_units == 'data'
    assert arrow.start is None
    assert arrow.x_end is None
    assert arrow.y_end is None
    assert arrow.end_units == 'data'
    assert isinstance(arrow.end, ArrowHead)
    assert arrow.source is None
    assert arrow.x_range_name == "default"
    assert arrow.y_range_name == "default"
    check_line_properties(arrow)
    check_properties_existence(arrow, [
        "plot",
        "level",
        "visible",
        "x_start",
        "y_start",
        "start_units",
        "start",
        "x_end",
        "y_end",
        "end_units",
        "end",
        "source",
        "x_range_name",
        "y_range_name"],
        LINE)


def test_BoxAnnotation():
    box = BoxAnnotation()
    assert box.plot is None
    assert box.left is None
    assert box.left_units == 'data'
    assert box.right is None
    assert box.right_units == 'data'
    assert box.bottom is None
    assert box.bottom_units == 'data'
    assert box.top is None
    assert box.top_units == 'data'
    assert box.x_range_name == 'default'
    assert box.y_range_name == 'default'
    assert box.level == 'annotation'
    check_line_properties(box, "", '#cccccc', 1, 0.3)
    check_fill_properties(box, "", "#fff9ba", 0.4)
    check_properties_existence(box, [
        "render_mode",
        "plot",
        "visible",
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


def test_Band():
    band = Band()
    assert band.plot is None
    assert band.level == 'annotation'
    assert band.lower is None
    assert band.lower_units == 'data'
    assert band.upper is None
    assert band.upper_units == 'data'
    assert band.base is None
    assert band.dimension == 'height'
    assert isinstance(band.source, ColumnDataSource)
    assert band.x_range_name == 'default'
    assert band.y_range_name == 'default'
    check_line_properties(band, "", "#cccccc", 1.0, 0.3)
    check_fill_properties(band, "", "#fff9ba", 0.4)
    check_properties_existence(band, [
        "plot",
        "visible",
        "level",
        "lower",
        "lower_units",
        "upper",
        "upper_units",
        "base",
        "base_units",
        "dimension",
        "source",
        "x_range_name",
        "y_range_name",
    ], LINE, FILL)


def test_Label():
    label = Label()
    assert label.plot is None
    assert label.level == 'annotation'
    assert label.x is None
    assert label.y is None
    assert label.x_units == 'data'
    assert label.y_units == 'data'
    assert label.text is None
    assert label.angle == 0
    assert label.angle_units == 'rad'
    assert label.x_offset == 0
    assert label.y_offset == 0
    assert label.render_mode == 'canvas'
    assert label.x_range_name == 'default'
    assert label.y_range_name == 'default'
    check_text_properties(label)
    check_fill_properties(label, "background_", None, 1.0)
    check_line_properties(label, "border_", None, 1.0, 1.0)
    check_properties_existence(label, [
        "plot",
        "level",
        "visible",
        "x",
        "y",
        "x_units",
        "y_units",
        "text",
        "angle",
        "angle_units",
        "x_offset",
        "y_offset",
        "render_mode",
        "x_range_name",
        "y_range_name"],
        TEXT,
        prefix('border_', LINE),
        prefix('background_', FILL))

def test_Label_accepts_datetime_xy():
    obj = Label(x = datetime(2018,8,7,0,0),
                y = datetime(2018,8,7,0,0))
    assert obj.x == 1533600000000.0
    assert obj.y == 1533600000000.0

def test_LabelSet():
    label_set = LabelSet()
    assert label_set.plot is None
    assert label_set.level == 'annotation'
    assert label_set.x is None
    assert label_set.y is None
    assert label_set.x_units == 'data'
    assert label_set.y_units == 'data'
    assert label_set.text == 'text'
    assert label_set.angle == 0
    assert label_set.angle_units == 'rad'
    assert label_set.x_offset == 0
    assert label_set.y_offset == 0
    assert label_set.render_mode == 'canvas'
    assert label_set.x_range_name == 'default'
    assert label_set.y_range_name == 'default'
    assert isinstance(label_set.source, ColumnDataSource)
    assert label_set.source.data == {}
    check_text_properties(label_set)
    check_fill_properties(label_set, "background_", None, 1.0)
    check_line_properties(label_set, "border_", None, 1.0, 1.0)
    check_properties_existence(label_set, [
        "plot",
        "visible",
        "level",
        "x",
        "y",
        "x_units",
        "y_units",
        "text",
        "angle",
        "angle_units",
        "x_offset",
        "y_offset",
        "render_mode",
        "x_range_name",
        "y_range_name",
        "source"],
        TEXT,
        ANGLE,
        prefix('border_', LINE),
        prefix('background_', FILL))

def test_Slope():
    slope = Slope()
    assert slope.plot is None
    assert slope.gradient is None
    assert slope.y_intercept is None
    assert slope.x_range_name == 'default'
    assert slope.y_range_name == 'default'
    assert slope.level == 'annotation'
    check_line_properties(slope, "", 'black', 1.0)
    check_properties_existence(slope, [
        "plot",
        "visible",
        "gradient",
        "y_intercept",
        "x_range_name",
        "y_range_name",
        "level",
    ], LINE)


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
    check_line_properties(line, "", 'black', 1.0)
    check_properties_existence(line, [
        "plot",
        "visible",
        "location",
        "location_units",
        "dimension",
        "x_range_name",
        "y_range_name",
        "level",
        "render_mode"
    ], LINE)

def test_Span_accepts_datetime_location():
    obj = Span(location = datetime(2018,8,7,0,0))
    assert obj.location == 1533600000000.0

def test_Title():
    title = Title()
    assert title.plot is None
    assert title.level == 'annotation'
    assert title.text is None
    assert title.vertical_align == 'bottom'
    assert title.align == 'left'
    assert title.offset == 0
    assert title.text_font == 'helvetica'
    assert title.text_font_size == {'value': '10pt'}
    assert title.text_font_style == 'bold'
    assert title.text_color == '#444444'
    assert title.text_alpha == 1.0
    check_fill_properties(title, "background_", None, 1.0)
    check_line_properties(title, "border_", None, 1.0, 1.0)
    check_properties_existence(title, [
        "plot",
        "visible",
        "level",
        "text",
        "vertical_align",
        "align",
        "offset",
        "text_font",
        "text_font_size",
        "text_font_style",
        "text_color",
        "text_alpha",
        "render_mode"],
        prefix('border_', LINE),
        prefix('background_', FILL))


def test_Whisker():
    whisker = Whisker()
    assert whisker.plot is None
    assert whisker.level == 'underlay'
    assert whisker.lower is None
    assert whisker.lower_units == 'data'
    assert isinstance(whisker.lower_head, ArrowHead)
    assert whisker.lower_head.size == 10
    assert whisker.lower_head.level == 'underlay'
    assert whisker.upper is None
    assert whisker.upper_units == 'data'
    assert isinstance(whisker.upper_head, ArrowHead)
    assert whisker.upper_head.size == 10
    assert whisker.upper_head.level == 'underlay'
    assert whisker.base is None
    assert whisker.dimension == 'height'
    assert isinstance(whisker.source, ColumnDataSource)
    assert whisker.x_range_name == 'default'
    assert whisker.y_range_name == 'default'
    check_line_properties(whisker, "")
    check_properties_existence(whisker, [
        "plot",
        "visible",
        "level",
        "lower",
        "lower_units",
        "lower_head",
        "upper",
        "upper_units",
        "upper_head",
        "base",
        "base_units",
        "dimension",
        "source",
        "x_range_name",
        "y_range_name"],
        LINE)


def test_can_add_multiple_glyph_renderers_to_legend_item():
    legend_item = LegendItem()
    gr_1 = GlyphRenderer()
    gr_2 = GlyphRenderer()
    legend_item.renderers = [gr_1, gr_2]
    with mock.patch('bokeh.core.validation.check.log') as mock_logger:
        check_integrity([legend_item])
        assert mock_logger.error.call_count == 0


def test_legend_item_with_field_label_and_different_data_sources_raises_a_validation_error():
    legend_item = LegendItem()
    gr_1 = GlyphRenderer(data_source=ColumnDataSource(data={'label': [1]}))
    gr_2 = GlyphRenderer(data_source=ColumnDataSource(data={'label': [1]}))
    legend_item.label = field('label')
    legend_item.renderers = [gr_1, gr_2]
    with mock.patch('bokeh.core.validation.check.log') as mock_logger:
        check_integrity([legend_item])
        assert mock_logger.error.call_count == 1


def test_legend_item_with_value_label_and_different_data_sources_does_not_raise_a_validation_error():
    legend_item = LegendItem()
    gr_1 = GlyphRenderer(data_source=ColumnDataSource())
    gr_2 = GlyphRenderer(data_source=ColumnDataSource())
    legend_item.label = value('label')
    legend_item.renderers = [gr_1, gr_2]
    with mock.patch('bokeh.core.validation.check.log') as mock_logger:
        check_integrity([legend_item])
        assert mock_logger.error.call_count == 0


def test_legend_item_with_field_label_raises_error_if_field_not_in_cds():
    legend_item = LegendItem()
    gr_1 = GlyphRenderer(data_source=ColumnDataSource())
    legend_item.label = field('label')
    legend_item.renderers = [gr_1]
    with mock.patch('bokeh.core.validation.check.log') as mock_logger:
        check_integrity([legend_item])
        assert mock_logger.error.call_count == 1
