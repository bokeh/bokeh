#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports
import six

# Bokeh imports
from bokeh.colors import named
from bokeh.palettes import __palettes__
from bokeh._testing.util.api import verify_all

# Module under test
import bokeh.core.enums as bce

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

ALL  = (
    'Align',
    'Anchor',
    'AngleUnits',
    'ButtonType',
    'DashPattern',
    'DateFormat',
    'DatetimeUnits',
    'Dimension',
    'Dimensions',
    'Direction',
    'Enumeration',
    'enumeration',
    'FontStyle',
    'HatchPattern',
    'HatchPatternAbbreviation',
    'HoldPolicy',
    'HorizontalLocation',
    'JitterRandomDistribution',
    'LatLon',
    'LegendClickPolicy',
    'LegendLocation',
    'LineCap',
    'LineDash',
    'LineJoin',
    'Location',
    'MapType',
    'MarkerType',
    'NamedColor',
    'NumeralLanguage',
    'Orientation',
    'OutputBackend',
    'PaddingUnits',
    'Palette',
    'RenderLevel',
    'RenderMode',
    'ResetPolicy',
    'RoundingFunction',
    'SizingMode',
    'SizingPolicy',
    'SliderCallbackPolicy',
    'SortDirection',
    'SpatialUnits',
    'StartEnd',
    'StepMode',
    'TextAlign',
    'TextBaseline',
    'TextureRepetition',
    'TickLabelOrientation',
    'TooltipAttachment',
    'TooltipFieldFormatter',
    'TrackPolicy',
    'VerticalAlign',
    'VerticalLocation',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_Enumeration_default():
    e = bce.Enumeration()
    assert e.__slots__ == ()

class Test_enumeration(object):
    def test_basic(self):
        e = bce.enumeration("foo", "bar", "baz")
        assert isinstance(e, bce.Enumeration)
        assert str(e) == "Enumeration(foo, bar, baz)"
        assert [x for x in e] == ["foo", "bar", "baz"]
        for x in ["foo", "bar", "baz"]:
            assert x in e
        assert "junk" not in e

    def test_case(self):
        e = bce.enumeration("foo", "bar", "baz", case_sensitive=False)
        assert isinstance(e, bce.Enumeration)
        assert str(e) == "Enumeration(foo, bar, baz)"
        assert [x for x in e] == ["foo", "bar", "baz"]
        for x in ["foo", "FOO", "bar", "bAr", "baz", "BAZ"]:
            assert x in e
        assert "junk" not in e

    @pytest.mark.skipif(six.PY2, reason="Unimportant uicode silliness, py2 going away soon")
    def test_quote(self):
        e = bce.enumeration("foo", "bar", "baz", quote=True)
        assert isinstance(e, bce.Enumeration)
        assert str(e) == 'Enumeration("foo", "bar", "baz")' or str(e) == "Enumeration('foo', 'bar', 'baz')"
        assert [x for x in e] == ["foo", "bar", "baz"]
        for x in ["foo", "bar", "baz"]:
            assert x in e
        assert "junk" not in e

    def test_default(self):
        # this is private but used by properties
        e = bce.enumeration("foo", "bar", "baz")
        assert e._default == "foo"

    def test_len(self):
        e = bce.enumeration("foo", "bar", "baz")
        assert len(e) == 3

class Test_bce(object):

    def test_Anchor(self):
        assert tuple(bce.Anchor) == (
            "top_left",    "top_center",    "top_right",
            "center_left", "center",        "center_right",
            "bottom_left", "bottom_center", "bottom_right"
        )

    def test_AngleUnits(self):
        assert tuple(bce.AngleUnits) == ('deg', 'rad')

    def test_ButtonType(self):
        assert tuple(bce.ButtonType) == ("default", "primary", "success", "warning", "danger")

    def test_DashPattern(self):
        assert tuple(bce.DashPattern) ==("solid", "dashed", "dotted", "dotdash", "dashdot")

    def test_DateFormat(self):
        assert tuple(bce.DateFormat) == ("ATOM", "W3C", "RFC-3339", "ISO-8601", "COOKIE", "RFC-822",
                                        "RFC-850", "RFC-1036", "RFC-1123", "RFC-2822", "RSS", "TIMESTAMP")

    def test_DatetimeUnits(self):
        assert tuple(bce.DatetimeUnits) == ("microseconds", "milliseconds", "seconds", "minsec",
                                            "minutes", "hourmin", "hours", "days", "months", "years")

    def test_Dimension(self):
        assert tuple(bce.Dimension) == ("width", "height")

    def test_Dimensions(self):
        assert tuple(bce.Dimensions) == ("width", "height", "both")

    def test_Direction(self):
        assert tuple(bce.Direction) == ("clock", "anticlock")

    def test_FontStyle(self):
        assert tuple(bce.FontStyle) == ('normal', 'italic', 'bold', 'bold italic')

    def test_HatchPattern(self):
        assert tuple(bce.HatchPattern) == (
            "blank", "dot", "ring", "horizontal_line", "vertical_line", "cross", "horizontal_dash", "vertical_dash",
            "spiral", "right_diagonal_line", "left_diagonal_line", "diagonal_cross", "right_diagonal_dash",
            "left_diagonal_dash", "horizontal_wave", "vertical_wave", "criss_cross"
        )

    def test_HatchPatternAbbreviation(self):
        assert tuple(bce.HatchPatternAbbreviation) ==(' ', '.', 'o', '-', '|', '+', '"', ':', '@', '/', '\\', 'x', ',', '`', 'v', '>', '*')

    def test_HoldPolicy(self):
        assert tuple(bce.HoldPolicy) == ("combine", "collect")

    def test_HorizontalLocation(self):
        assert tuple(bce.HorizontalLocation) == ("left", "right")

    def test_JitterRandomDistribution(self):
        assert tuple(bce.JitterRandomDistribution) == ("uniform", "normal")

    def test_LatLon(self):
        assert tuple(bce.LatLon) == ("lat", "lon")

    def test_LegendClickPolicy(self):
        assert tuple(bce.LegendClickPolicy) == ("none", "hide", "mute")

    def test_LegendLocation(self):
        assert tuple(bce.LegendLocation) == (
            "top_left",    "top_center",    "top_right",
            "center_left", "center",        "center_right",
            "bottom_left", "bottom_center", "bottom_right"
        )

    def test_LineCap(self):
        assert tuple(bce.LineCap) == ("butt", "round", "square")

    def test_LineDash(self):
        assert tuple(bce.LineDash) == ("solid", "dashed", "dotted", "dotdash", "dashdot")

    def test_LineJoin(self):
        assert tuple(bce.LineJoin) == ("miter", "round", "bevel")

    def test_Location(self):
        assert tuple(bce.Location) == ("above", "below", "left", "right")

    def test_MapType(self):
        assert tuple(bce.MapType) == ("satellite", "roadmap", "terrain", "hybrid")

    def test_MarkerType(self):
        assert tuple(bce.MarkerType) == ("asterisk", "circle", "circle_cross", "circle_x", "cross",
                                         "dash", "diamond", "diamond_cross", "hex", "inverted_triangle",
                                         "square", "square_cross", "square_x", "triangle", "x")

    def test_NamedColor(self):
        assert len(tuple(bce.NamedColor)) == 147
        assert tuple(bce.NamedColor) == tuple(named.__all__)

    def test_NumeralLanguage(self):
        assert tuple(bce.NumeralLanguage) == ("be-nl", "chs", "cs", "da-dk", "de-ch", "de", "en",
                                              "en-gb", "es-ES", "es", "et", "fi", "fr-CA", "fr-ch",
                                              "fr", "hu", "it", "ja", "nl-nl", "pl", "pt-br",
                                              "pt-pt", "ru", "ru-UA", "sk", "th", "tr", "uk-UA")

    def test_Orientation(self):
        assert tuple(bce.Orientation) == ("horizontal", "vertical")

    def test_OutputBackend(self):
        assert tuple(bce.OutputBackend) == ("canvas", "svg", "webgl")

    def test_PaddingUnits(self):
        assert tuple(bce.PaddingUnits) == ("percent", "absolute")

    def test_Palette(self):
        assert tuple(bce.Palette) == tuple(__palettes__)

    def test_RenderLevel(self):
        assert tuple(bce.RenderLevel) == ("image", "underlay", "glyph", "annotation", "overlay")

    def test_RenderMode(self):
        assert tuple(bce.RenderMode) == ("canvas", "css")

    def test_ResetPolicy(self):
        assert tuple(bce.ResetPolicy) == ("standard", "event_only")

    def test_RoundingFunction(self):
        assert tuple(bce.RoundingFunction) == ("round", "nearest", "floor", "rounddown", "ceil", "roundup")

    def test_SizingMode(self):
        assert tuple(bce.SizingMode) == ("stretch_width", "stretch_height", "stretch_both", "scale_width", "scale_height", "scale_both", "fixed")

    def test_SliderCallbackPolicy(self):
        assert tuple(bce.SliderCallbackPolicy) == ("continuous", "throttle", "mouseup")

    def test_SortDirection(self):
        assert tuple(bce.SortDirection) == ("ascending", "descending")

    def test_SpatialUnits(self):
        assert tuple(bce.SpatialUnits) == ("screen", "data")

    def test_StartEnd(self):
        assert tuple(bce.StartEnd) == ("start", "end")

    def test_StepMode(self):
        assert tuple(bce.StepMode) == ("before", "after", "center")

    def test_TextAlign(self):
        assert tuple(bce.TextAlign) == ("left", "right", "center")

    def test_TextBaseline(self):
        assert tuple(bce.TextBaseline) == ("top", "middle", "bottom", "alphabetic", "hanging", "ideographic")

    def test_TextureRepetition(self):
        assert tuple(bce.TextureRepetition) == ("repeat", "repeat_x", "repeat_y", "no_repeat")

    def test_TickLabelOrientation(self):
        assert tuple(bce.TickLabelOrientation) == ("horizontal", "vertical", "parallel", "normal")

    def test_TooltipAttachment(self):
        assert tuple(bce.TooltipAttachment) == ("horizontal", "vertical", "left", "right", "above", "below")

    def test_TooltipFieldFormatter(self):
        assert tuple(bce.TooltipFieldFormatter) == ("numeral", "datetime", "printf")

    def test_VerticalAlign(self):
        assert tuple(bce.VerticalAlign) == ("top", "middle", "bottom")

    def test_VerticalLocation(self):
        assert tuple(bce.VerticalLocation) == ("above", "below")

# any changes to contents of bce.py easily trackable here
def test_enums_contents():
    enums = [x for x in ALL if x != "enumeration"]
    assert [x for x in dir(bce) if x[0].isupper()] == enums

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

Test___all__ = verify_all(bce, ALL)
