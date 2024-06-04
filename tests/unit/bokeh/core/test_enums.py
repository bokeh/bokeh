#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from bokeh.colors import named
from bokeh.palettes import __palettes__
from tests.support.util.api import verify_all

# Module under test
import bokeh.core.enums as bce # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL = (
    'Align',
    'AlternationPolicy',
    'Anchor',
    'AngleUnits',
    'AutosizeMode',
    'ButtonType',
    'CalendarPosition',
    'ContextWhich',
    'CoordinateUnits',
    'DashPattern',
    'DateFormat',
    'DatetimeUnits',
    'Dimension',
    'Dimensions',
    'Direction',
    'FlowMode',
    'FontStyle',
    'HAlign',
    'HatchPattern',
    'HatchPatternAbbreviation',
    'HoldPolicy',
    'HorizontalLocation',
    'ImageOrigin',
    'JitterRandomDistribution',
    'KeyModifier',
    'LabelOrientation',
    'LatLon',
    'LegendClickPolicy',
    'LegendLocation',
    'LineCap',
    'LineDash',
    'LineJoin',
    'Location',
    'MapType',
    'MarkerType',
    'Movable',
    'NamedColor',
    'NumeralLanguage',
    'Orientation',
    'OutlineShapeName',
    'OutputBackend',
    'PaddingUnits',
    'Palette',
    'Place',
    'RenderLevel',
    'ResetPolicy',
    'Resizable',
    'ResolutionType',
    'RoundingFunction',
    'ScrollbarPolicy',
    'SelectionMode',
    'SizingMode',
    'SizingPolicy',
    'SortDirection',
    'SpatialUnits',
    'StartEnd',
    'StepMode',
    'TextAlign',
    'TextBaseline',
    'TextureRepetition',
    'ToolIcon',
    'TooltipAttachment',
    'TooltipFieldFormatter',
    'TrackPolicy',
    'VAlign',
    'VerticalAlign',
    'VerticalLocation',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_Enumeration_default() -> None:
    e = bce.Enumeration()
    assert e.__slots__ == ()

class Test_enumeration:
    def test_basic(self) -> None:
        e = bce.enumeration("foo", "bar", "baz")
        assert isinstance(e, bce.Enumeration)
        assert str(e) == "Enumeration(foo, bar, baz)"
        assert [x for x in e] == ["foo", "bar", "baz"]
        for x in ["foo", "bar", "baz"]:
            assert x in e
        assert "junk" not in e

    def test_case(self) -> None:
        e = bce.enumeration("foo", "bar", "baz", case_sensitive=False)
        assert isinstance(e, bce.Enumeration)
        assert str(e) == "Enumeration(foo, bar, baz)"
        assert [x for x in e] == ["foo", "bar", "baz"]
        for x in ["foo", "FOO", "bar", "bAr", "baz", "BAZ"]:
            assert x in e
        assert "junk" not in e

    def test_quote(self) -> None:
        e = bce.enumeration("foo", "bar", "baz", quote=True)
        assert isinstance(e, bce.Enumeration)
        assert str(e) == 'Enumeration("foo", "bar", "baz")' or str(e) == "Enumeration('foo', 'bar', 'baz')"
        assert [x for x in e] == ["foo", "bar", "baz"]
        for x in ["foo", "bar", "baz"]:
            assert x in e
        assert "junk" not in e

    def test_default(self) -> None:
        # this is private but used by properties
        e = bce.enumeration("foo", "bar", "baz")
        assert e._default == "foo"

    def test_len(self) -> None:
        e = bce.enumeration("foo", "bar", "baz")
        assert len(e) == 3


class Test_bce:
    def test_Anchor(self) -> None:
        assert tuple(bce.Anchor) == (
            "top_left",    "top_center",    "top_right",
            "center_left", "center_center", "center_right",
            "bottom_left", "bottom_center", "bottom_right",
            "top", "left", "center", "right", "bottom",
        )

    def test_AngleUnits(self) -> None:
        assert tuple(bce.AngleUnits) == ("deg", "rad", "grad", "turn")

    def test_ButtonType(self) -> None:
        assert tuple(bce.ButtonType) == ("default", "primary", "success", "warning", "danger", "light")

    def test_CalendarPosition(self) -> None:
        assert tuple(bce.CalendarPosition) == ("auto", "above", "below")

    def test_ContextWhich(self) -> None:
        assert tuple(bce.ContextWhich) == ("start", "center", "end", "all")

    def test_DashPattern(self) -> None:
        assert tuple(bce.DashPattern) ==("solid", "dashed", "dotted", "dotdash", "dashdot")

    def test_DateFormat(self) -> None:
        assert tuple(bce.DateFormat) == ("ATOM", "W3C", "RFC-3339", "ISO-8601", "COOKIE", "RFC-822",
                                        "RFC-850", "RFC-1036", "RFC-1123", "RFC-2822", "RSS", "TIMESTAMP")

    def test_DatetimeUnits(self) -> None:
        assert tuple(bce.DatetimeUnits) == ("microseconds", "milliseconds", "seconds", "minsec",
                                            "minutes", "hourmin", "hours", "days", "months", "years")

    def test_Dimension(self) -> None:
        assert tuple(bce.Dimension) == ("width", "height")

    def test_Dimensions(self) -> None:
        assert tuple(bce.Dimensions) == ("width", "height", "both")

    def test_Direction(self) -> None:
        assert tuple(bce.Direction) == ("clock", "anticlock")

    def test_FontStyle(self) -> None:
        assert tuple(bce.FontStyle) == ('normal', 'italic', 'bold', 'bold italic')

    def test_HatchPattern(self) -> None:
        assert tuple(bce.HatchPattern) == (
            "blank", "dot", "ring", "horizontal_line", "vertical_line", "cross", "horizontal_dash", "vertical_dash",
            "spiral", "right_diagonal_line", "left_diagonal_line", "diagonal_cross", "right_diagonal_dash",
            "left_diagonal_dash", "horizontal_wave", "vertical_wave", "criss_cross",
        )

    def test_HatchPatternAbbreviation(self) -> None:
        assert tuple(bce.HatchPatternAbbreviation) ==(' ', '.', 'o', '-', '|', '+', '"', ':', '@', '/', '\\', 'x', ',', '`', 'v', '>', '*')

    def test_HoldPolicy(self) -> None:
        assert tuple(bce.HoldPolicy) == ("combine", "collect")

    def test_HorizontalLocation(self) -> None:
        assert tuple(bce.HorizontalLocation) == ("left", "right")

    def test_ImageOrigin(self) -> None:
        assert tuple(bce.ImageOrigin) == ("bottom_left", "top_left", "bottom_right", "top_right")

    def test_JitterRandomDistribution(self) -> None:
        assert tuple(bce.JitterRandomDistribution) == ("uniform", "normal")

    def test_KeyModifier(self) -> None:
        assert tuple(bce.KeyModifier) == ("shift", "ctrl", "alt")

    def test_LabelOrientation(self) -> None:
        assert tuple(bce.LabelOrientation) == ("horizontal", "vertical", "parallel", "normal")

    def test_LatLon(self) -> None:
        assert tuple(bce.LatLon) == ("lat", "lon")

    def test_AlternationPolicy(self) -> None:
        assert tuple(bce.AlternationPolicy) == ("none", "even", "odd", "every")

    def test_LegendClickPolicy(self) -> None:
        assert tuple(bce.LegendClickPolicy) == ("none", "hide", "mute")

    def test_LegendLocation(self) -> None:
        assert tuple(bce.LegendLocation) == (
            "top_left",    "top_center",    "top_right",
            "center_left", "center_center", "center_right",
            "bottom_left", "bottom_center", "bottom_right",
            "top", "left", "center", "right", "bottom",
        )

    def test_LineCap(self) -> None:
        assert tuple(bce.LineCap) == ("butt", "round", "square")

    def test_LineDash(self) -> None:
        assert tuple(bce.LineDash) == ("solid", "dashed", "dotted", "dotdash", "dashdot")

    def test_LineJoin(self) -> None:
        assert tuple(bce.LineJoin) == ("miter", "round", "bevel")

    def test_Location(self) -> None:
        assert tuple(bce.Location) == ("above", "below", "left", "right")

    def test_MapType(self) -> None:
        assert tuple(bce.MapType) == ("satellite", "roadmap", "terrain", "hybrid")

    def test_MarkerType(self) -> None:
        assert tuple(bce.MarkerType) == ("asterisk", "circle", "circle_cross", "circle_dot", "circle_x", "circle_y", "cross",
                                         "dash", "diamond", "diamond_cross", "diamond_dot", "dot", "hex", "hex_dot", "inverted_triangle",
                                         "plus", "square", "square_cross", "square_dot", "square_pin", "square_x", "star", "star_dot",
                                         "triangle", "triangle_dot", "triangle_pin", "x", "y")

    def test_Movable(self) -> None:
        assert tuple(bce.Movable) == ("none", "x", "y", "both")

    def test_NamedColor(self) -> None:
        assert len(tuple(bce.NamedColor)) == 148
        assert tuple(bce.NamedColor) == tuple(named.__all__)

    def test_NumeralLanguage(self) -> None:
        assert tuple(bce.NumeralLanguage) == ("be-nl", "chs", "cs", "da-dk", "de-ch", "de", "en",
                                              "en-gb", "es-ES", "es", "et", "fi", "fr-CA", "fr-ch",
                                              "fr", "hu", "it", "ja", "nl-nl", "pl", "pt-br",
                                              "pt-pt", "ru", "ru-UA", "sk", "th", "tr", "uk-UA")

    def test_Orientation(self) -> None:
        assert tuple(bce.Orientation) == ("horizontal", "vertical")

    def test_OutlineShapeName(self) -> None:
        assert tuple(bce.OutlineShapeName) == ("none", "box", "rectangle", "square", "circle", "ellipse", "trapezoid", "parallelogram", "diamond", "triangle")

    def test_OutputBackend(self) -> None:
        assert tuple(bce.OutputBackend) == ("canvas", "svg", "webgl")

    def test_PaddingUnits(self) -> None:
        assert tuple(bce.PaddingUnits) == ("percent", "absolute")

    def test_Palette(self) -> None:
        assert tuple(bce.Palette) == tuple(__palettes__)

    def test_RenderLevel(self) -> None:
        assert tuple(bce.RenderLevel) == ("image", "underlay", "glyph", "guide", "annotation", "overlay")

    def test_ResetPolicy(self) -> None:
        assert tuple(bce.ResetPolicy) == ("standard", "event_only")

    def test_Resizable(self) -> None:
        assert tuple(bce.Resizable) == ("none", "left", "right", "top", "bottom", "x", "y", "all")

    def test_ResolutionType(self) -> None:
        assert tuple(bce.ResolutionType) == ("microseconds", "milliseconds", "seconds", "minsec", "minutes", "hourmin", "hours", "days", "months", "years")

    def test_RoundingFunction(self) -> None:
        assert tuple(bce.RoundingFunction) == ("round", "nearest", "floor", "rounddown", "ceil", "roundup")

    def test_SelectionMode(self) -> None:
        assert tuple(bce.SelectionMode) == ("replace", "toggle", "append", "intersect", "subtract", "xor")

    def test_SizingMode(self) -> None:
        assert tuple(bce.SizingMode) == ("stretch_width", "stretch_height", "stretch_both", "scale_width", "scale_height", "scale_both", "fixed", "inherit")

    def test_SortDirection(self) -> None:
        assert tuple(bce.SortDirection) == ("ascending", "descending")

    def test_SpatialUnits(self) -> None:
        assert tuple(bce.SpatialUnits) == ("screen", "data")

    def test_StartEnd(self) -> None:
        assert tuple(bce.StartEnd) == ("start", "end")

    def test_StepMode(self) -> None:
        assert tuple(bce.StepMode) == ("before", "after", "center")

    def test_TextAlign(self) -> None:
        assert tuple(bce.TextAlign) == ("left", "right", "center")

    def test_TextBaseline(self) -> None:
        assert tuple(bce.TextBaseline) == ("top", "middle", "bottom", "alphabetic", "hanging", "ideographic")

    def test_TextureRepetition(self) -> None:
        assert tuple(bce.TextureRepetition) == ("repeat", "repeat_x", "repeat_y", "no_repeat")

    def test_ToolIcon(self) -> None:
        assert tuple(bce.ToolIcon) == (
            "append_mode",
            "arrow_down_to_bar",
            "arrow_up_from_bar",
            "auto_box_zoom",
            "bold",
            "box_edit",
            "box_select",
            "box_zoom",
            "caret_down",
            "caret_left",
            "caret_right",
            "caret_up",
            "check",
            "chevron_down",
            "chevron_left",
            "chevron_right",
            "chevron_up",
            "clear_selection",
            "copy",
            "crosshair",
            "delete",
            "freehand_draw",
            "fullscreen",
            "help",
            "hover",
            "intersect_mode",
            "invert_selection",
            "italic",
            "lasso_select",
            "line_edit",
            "maximize",
            "minimize",
            "pan",
            "pin",
            "point_draw",
            "pointer",
            "poly_draw",
            "poly_edit",
            "polygon_select",
            "range",
            "redo",
            "replace_mode",
            "reset",
            "save",
            "see_off",
            "see_on",
            "settings",
            "square",
            "square_check",
            "subtract_mode",
            "tap_select",
            "text_align_center",
            "text_align_left",
            "text_align_right",
            "undo",
            "unknown",
            "unpin",
            "wheel_pan",
            "wheel_zoom",
            "x_box_select",
            "x_box_zoom",
            "x_grip",
            "x_pan",
            "xor_mode",
            "y_box_select",
            "y_box_zoom",
            "y_grip",
            "y_pan",
            "zoom_in",
            "zoom_out",
        )

    def test_TooltipAttachment(self) -> None:
        assert tuple(bce.TooltipAttachment) == ("horizontal", "vertical", "left", "right", "above", "below")

    def test_TooltipFieldFormatter(self) -> None:
        assert tuple(bce.TooltipFieldFormatter) == ("numeral", "datetime", "printf")

    def test_VerticalAlign(self) -> None:
        assert tuple(bce.VerticalAlign) == ("top", "middle", "bottom")

    def test_VerticalLocation(self) -> None:
        assert tuple(bce.VerticalLocation) == ("above", "below")

# any changes to contents of bce.py easily trackable here
def test_enums_contents() -> None:
    assert [name for name in dir(bce) if isinstance(getattr(bce, name), bce.Enumeration)] == list(ALL)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bce, ALL)
