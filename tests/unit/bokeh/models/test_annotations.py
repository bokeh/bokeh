#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from datetime import datetime

# External imports
import mock

# Bokeh imports
from bokeh.core.properties import field, value
from bokeh.core.validation import check_integrity, process_validation_issues
from bokeh.models import (
    Arrow,
    ArrowHead,
    Band,
    BoxAnnotation,
    ColorBar,
    ColumnDataSource,
    GlyphRenderer,
    Label,
    LabelSet,
    Legend,
    LegendItem,
    LinearColorMapper,
    PolyAnnotation,
    Slope,
    Span,
    Title,
    Whisker,
)

from _util_models import (
    ANGLE,
    FILL,
    HATCH,
    LINE,
    TEXT,
    check_fill_properties,
    check_hatch_properties,
    check_line_properties,
    check_properties_existence,
    check_text_properties,
    prefix,
)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ANNOTATION = [
    "visible",
    "level",
    "coordinates",
    "x_range_name",
    "y_range_name",
    "group",
]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_Legend() -> None:
    legend = Legend()
    assert legend.location == 'top_right'
    assert legend.orientation == 'vertical'
    assert legend.title is None
    assert legend.title_standoff == 5
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
    check_text_properties(legend, "label_", "13px", "middle", scalar=True)
    check_fill_properties(legend, "background_", "#ffffff", 0.95)
    check_properties_existence(legend, ANNOTATION + [
        "location",
        "orientation",
        "title",
        "title_standoff",
        "label_standoff",
        "label_height",
        "label_width",
        "glyph_height",
        "glyph_width",
        "margin",
        "padding",
        "spacing",
        "items",
        "click_policy",
    ],
        prefix('label_', TEXT),
        prefix('title_', TEXT),
        prefix('border_', LINE),
        prefix('background_', FILL),
        prefix('inactive_', FILL),
    )


def test_ColorBar() -> None:
    color_mapper = LinearColorMapper()
    color_bar = ColorBar(color_mapper=color_mapper)
    assert color_bar.location == 'top_right'
    assert color_bar.orientation == 'auto'
    assert color_bar.height == 'auto'
    assert color_bar.width == 'auto'
    assert color_bar.scale_alpha == 1.0
    assert color_bar.title is None
    assert color_bar.title_standoff == 2
    assert color_bar.ticker == "auto"
    assert color_bar.formatter == "auto"
    assert color_bar.color_mapper == color_mapper
    assert color_bar.margin == 30
    assert color_bar.padding == 10
    assert color_bar.label_standoff == 5
    assert color_bar.major_tick_in == 5
    assert color_bar.major_tick_out == 0
    assert color_bar.minor_tick_in == 0
    assert color_bar.minor_tick_out == 0
    check_text_properties(color_bar, "title_", "13px", "bottom", "italic", scalar=True)
    check_text_properties(color_bar, "major_label_", "11px", "bottom", "normal", "left", scalar=True)
    check_line_properties(color_bar, "major_tick_", "#ffffff")
    check_line_properties(color_bar, "minor_tick_", None)
    check_line_properties(color_bar, "bar_", None)
    check_line_properties(color_bar, "border_", None)
    check_fill_properties(color_bar, "background_", "#ffffff", 0.95)
    check_properties_existence(color_bar, ANNOTATION + [
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
        "major_label_overrides",
        "major_label_policy",
    ],
        prefix('title_', TEXT),
        prefix('major_label_', TEXT),
        prefix('major_tick_', LINE),
        prefix('minor_tick_', LINE),
        prefix('bar_', LINE),
        prefix('border_', LINE),
        prefix('background_', FILL),
    )


def test_Arrow() -> None:
    arrow = Arrow()
    assert arrow.x_start == field("x_start")
    assert arrow.y_start == field("y_start")
    assert arrow.start_units == 'data'
    assert arrow.start is None
    assert arrow.x_end == field("x_end")
    assert arrow.y_end == field("y_end")
    assert arrow.end_units == 'data'
    assert isinstance(arrow.end, ArrowHead)
    assert isinstance(arrow.source, ColumnDataSource)
    assert arrow.x_range_name == "default"
    assert arrow.y_range_name == "default"
    check_line_properties(arrow)
    check_properties_existence(arrow, ANNOTATION + [
        "x_start",
        "y_start",
        "start_units",
        "start",
        "x_end",
        "y_end",
        "end_units",
        "end",
        "source",
    ], LINE)


def test_BoxAnnotation() -> None:
    box = BoxAnnotation()
    assert box.left is None
    assert box.left_units == "data"
    assert box.right is None
    assert box.right_units == "data"
    assert box.bottom is None
    assert box.bottom_units == "data"
    assert box.top is None
    assert box.top_units == "data"
    assert box.x_range_name == "default"
    assert box.y_range_name == "default"
    assert box.level == "annotation"
    check_line_properties(box, "", "#cccccc", 1, 0.3)
    check_fill_properties(box, "", "#fff9ba", 0.4)
    check_hatch_properties(box)
    check_properties_existence(box, ANNOTATION + [
        "render_mode",
        "left",
        "left_units",
        "right",
        "right_units",
        "bottom",
        "bottom_units",
        "top",
        "top_units",
    ], LINE, FILL, HATCH)


def test_Band() -> None:
    band = Band()
    assert band.level == 'annotation'
    assert band.lower == field("lower")
    assert band.lower_units == 'data'
    assert band.upper == field("upper")
    assert band.upper_units == 'data'
    assert band.base == field("base")
    assert band.dimension == 'height'
    assert isinstance(band.source, ColumnDataSource)
    assert band.x_range_name == 'default'
    assert band.y_range_name == 'default'
    check_line_properties(band, "", "#cccccc", 1.0, 0.3)
    check_fill_properties(band, "", "#fff9ba", 0.4)
    check_properties_existence(band, ANNOTATION + [
        "lower",
        "lower_units",
        "upper",
        "upper_units",
        "base",
        "base_units",
        "dimension",
        "source",
    ], LINE, FILL)


def test_Label() -> None:
    label = Label(x=11, y=12)
    assert label.level == 'annotation'
    assert label.x == 11
    assert label.y == 12
    assert label.x_units == 'data'
    assert label.y_units == 'data'
    assert label.text == ""
    assert label.angle == 0
    assert label.angle_units == 'rad'
    assert label.x_offset == 0
    assert label.y_offset == 0
    assert label.render_mode == 'canvas'
    assert label.x_range_name == 'default'
    assert label.y_range_name == 'default'
    check_text_properties(label, scalar=True)
    check_fill_properties(label, "background_", None, 1.0)
    check_line_properties(label, "border_", None, 1.0, 1.0)
    check_properties_existence(label, ANNOTATION + [
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
    ],
        TEXT,
        prefix('border_', LINE),
        prefix('background_', FILL),
    )

def test_Label_accepts_datetime_xy() -> None:
    obj = Label(x = datetime(2018,8,7,0,0),
                y = datetime(2018,8,7,0,0))
    assert obj.x == 1533600000000.0
    assert obj.y == 1533600000000.0

def test_LabelSet() -> None:
    label_set = LabelSet()
    assert label_set.level == 'annotation'
    assert label_set.x == field("x")
    assert label_set.y == field("y")
    assert label_set.x_units == 'data'
    assert label_set.y_units == 'data'
    assert label_set.text == field("text")
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
    check_properties_existence(label_set, ANNOTATION + [
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
        "source",
    ],
        TEXT,
        ANGLE,
        prefix('border_', LINE),
        prefix('background_', FILL),
    )

def test_PolyAnnotation() -> None:
    poly = PolyAnnotation()
    assert poly.xs == []
    assert poly.xs_units == "data"
    assert poly.ys == []
    assert poly.ys_units == "data"
    assert poly.x_range_name == "default"
    assert poly.y_range_name == "default"
    assert poly.level == "annotation"
    check_line_properties(poly, "", "#cccccc", 1, 0.3)
    check_fill_properties(poly, "", "#fff9ba", 0.4)
    check_hatch_properties(poly)
    check_properties_existence(poly, ANNOTATION + [
        "xs",
        "xs_units",
        "ys",
        "ys_units",
    ], LINE, FILL, HATCH)

def test_Slope() -> None:
    slope = Slope()
    assert slope.gradient is None
    assert slope.y_intercept is None
    assert slope.x_range_name == 'default'
    assert slope.y_range_name == 'default'
    assert slope.level == 'annotation'
    check_line_properties(slope, "", 'black', 1.0)
    check_properties_existence(slope, ANNOTATION + [
        "gradient",
        "y_intercept",
    ], LINE)


def test_Span() -> None:
    line = Span()
    assert line.location is None
    assert line.location_units == 'data'
    assert line.dimension == 'width'
    assert line.x_range_name == 'default'
    assert line.y_range_name == 'default'
    assert line.level == 'annotation'
    assert line.render_mode == 'canvas'
    check_line_properties(line, "", 'black', 1.0)
    check_properties_existence(line, ANNOTATION + [
        "location",
        "location_units",
        "dimension",
        "render_mode"
    ], LINE)

def test_Span_accepts_datetime_location() -> None:
    obj = Span(location = datetime(2018,8,7,0,0))
    assert obj.location == 1533600000000.0

def test_Title() -> None:
    title = Title()
    assert title.level == 'annotation'
    assert title.text == ""
    assert title.vertical_align == 'bottom'
    assert title.align == 'left'
    assert title.offset == 0
    assert title.text_font == 'helvetica'
    assert title.text_font_size == '13px'
    assert title.text_font_style == 'bold'
    assert title.text_color == '#444444'
    assert title.text_alpha == 1.0
    assert title.text_line_height == 1.0
    check_fill_properties(title, "background_", None, 1.0)
    check_line_properties(title, "border_", None, 1.0, 1.0)
    check_properties_existence(title, ANNOTATION + [
        "text",
        "vertical_align",
        "align",
        "offset",
        "standoff",
        "text_font",
        "text_font_size",
        "text_font_style",
        "text_color",
        "text_alpha",
        "text_line_height",
        "render_mode",
    ],
        prefix('border_', LINE),
        prefix('background_', FILL),
    )


def test_Whisker() -> None:
    whisker = Whisker()
    assert whisker.level == 'underlay'
    assert whisker.lower == field("lower")
    assert whisker.lower_units == 'data'
    assert isinstance(whisker.lower_head, ArrowHead)
    assert whisker.lower_head.size == 10
    assert whisker.upper == field("upper")
    assert whisker.upper_units == 'data'
    assert isinstance(whisker.upper_head, ArrowHead)
    assert whisker.upper_head.size == 10
    assert whisker.base == field("base")
    assert whisker.dimension == 'height'
    assert isinstance(whisker.source, ColumnDataSource)
    assert whisker.x_range_name == 'default'
    assert whisker.y_range_name == 'default'
    check_line_properties(whisker, "")
    check_properties_existence(whisker, ANNOTATION + [
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
    ], LINE)

def test_Whisker_and_Band_accept_negative_values() -> None:
    whisker = Whisker(base=-1., lower=-1.5, upper=-0.5)
    assert whisker.base == -1.
    assert whisker.lower == -1.5
    assert whisker.upper == -0.5
    band = Band(base=-1., lower=-1.5, upper=-0.5)
    assert band.base == -1.
    assert band.lower == -1.5
    assert band.upper == -0.5

def test_can_add_multiple_glyph_renderers_to_legend_item() -> None:
    legend_item = LegendItem()
    gr_1 = GlyphRenderer(data_source=ColumnDataSource())
    gr_2 = GlyphRenderer(data_source=ColumnDataSource())
    legend_item.renderers = [gr_1, gr_2]
    with mock.patch('bokeh.core.validation.check.log') as mock_logger:
        issues = check_integrity([legend_item])
        process_validation_issues(issues)
        assert mock_logger.error.call_count == 0


def test_legend_item_with_field_label_and_different_data_sources_raises_a_validation_error() -> None:
    legend_item = LegendItem()
    gr_1 = GlyphRenderer(data_source=ColumnDataSource(data={'label': [1]}))
    gr_2 = GlyphRenderer(data_source=ColumnDataSource(data={'label': [1]}))
    legend_item.label = field('label')
    legend_item.renderers = [gr_1, gr_2]
    with mock.patch('bokeh.core.validation.check.log') as mock_logger:
        issues = check_integrity([legend_item])
        process_validation_issues(issues)
        assert mock_logger.error.call_count == 1


def test_legend_item_with_value_label_and_different_data_sources_does_not_raise_a_validation_error() -> None:
    legend_item = LegendItem()
    gr_1 = GlyphRenderer(data_source=ColumnDataSource())
    gr_2 = GlyphRenderer(data_source=ColumnDataSource())
    legend_item.label = value('label')
    legend_item.renderers = [gr_1, gr_2]
    with mock.patch('bokeh.core.validation.check.log') as mock_logger:
        issues = check_integrity([legend_item])
        process_validation_issues(issues)
        assert mock_logger.error.call_count == 0


def test_legend_item_with_field_label_raises_error_if_field_not_in_cds() -> None:
    legend_item = LegendItem()
    gr_1 = GlyphRenderer(data_source=ColumnDataSource())
    legend_item.label = field('label')
    legend_item.renderers = [gr_1]
    with mock.patch('bokeh.core.validation.check.log') as mock_logger:
        issues = check_integrity([legend_item])
        process_validation_issues(issues)
        assert mock_logger.error.call_count == 1

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
