#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
# TODO (bev) validate entire list of props

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Module under test
from bokeh.models.tools import Tool, Toolbar # isort:skip
import bokeh.models.tools as t # isort:skip

# Bokeh imports
from bokeh.core.validation.check import ValidationIssues, check_integrity
from bokeh.models import (
    Block,
    ColumnDataSource,
    GlyphRenderer,
    HBar,
    Quad,
    Rect,
    VBar,
)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_Tool_from_string() -> None:
    assert isinstance(Tool.from_string("pan"), t.PanTool)
    assert isinstance(Tool.from_string("xpan"), t.PanTool)
    assert isinstance(Tool.from_string("ypan"), t.PanTool)
    assert isinstance(Tool.from_string("xwheel_pan"), t.WheelPanTool)
    assert isinstance(Tool.from_string("ywheel_pan"), t.WheelPanTool)
    assert isinstance(Tool.from_string("wheel_zoom"), t.WheelZoomTool)
    assert isinstance(Tool.from_string("xwheel_zoom"), t.WheelZoomTool)
    assert isinstance(Tool.from_string("ywheel_zoom"), t.WheelZoomTool)
    assert isinstance(Tool.from_string("zoom_in"), t.ZoomInTool)
    assert isinstance(Tool.from_string("xzoom_in"), t.ZoomInTool)
    assert isinstance(Tool.from_string("yzoom_in"), t.ZoomInTool)
    assert isinstance(Tool.from_string("zoom_out"), t.ZoomOutTool)
    assert isinstance(Tool.from_string("xzoom_out"), t.ZoomOutTool)
    assert isinstance(Tool.from_string("yzoom_out"), t.ZoomOutTool)
    assert isinstance(Tool.from_string("click"), t.TapTool)
    assert isinstance(Tool.from_string("tap"), t.TapTool)
    assert isinstance(Tool.from_string("crosshair"), t.CrosshairTool)
    assert isinstance(Tool.from_string("box_select"), t.BoxSelectTool)
    assert isinstance(Tool.from_string("xbox_select"), t.BoxSelectTool)
    assert isinstance(Tool.from_string("ybox_select"), t.BoxSelectTool)
    assert isinstance(Tool.from_string("poly_select"), t.PolySelectTool)
    assert isinstance(Tool.from_string("lasso_select"), t.LassoSelectTool)
    assert isinstance(Tool.from_string("line_edit"), t.LineEditTool)
    assert isinstance(Tool.from_string("box_zoom"), t.BoxZoomTool)
    assert isinstance(Tool.from_string("xbox_zoom"), t.BoxZoomTool)
    assert isinstance(Tool.from_string("ybox_zoom"), t.BoxZoomTool)
    assert isinstance(Tool.from_string("save"), t.SaveTool)
    assert isinstance(Tool.from_string("copy"), t.CopyTool)
    assert isinstance(Tool.from_string("undo"), t.UndoTool)
    assert isinstance(Tool.from_string("redo"), t.RedoTool)
    assert isinstance(Tool.from_string("reset"), t.ResetTool)
    assert isinstance(Tool.from_string("help"), t.HelpTool)
    assert isinstance(Tool.from_string("examine"), t.ExamineTool)
    assert isinstance(Tool.from_string("box_edit"), t.BoxEditTool)
    assert isinstance(Tool.from_string("point_draw"), t.PointDrawTool)
    assert isinstance(Tool.from_string("poly_draw"), t.PolyDrawTool)
    assert isinstance(Tool.from_string("poly_edit"), t.PolyEditTool)
    assert isinstance(Tool.from_string("hover"), t.HoverTool)


def test_Toolbar() -> None:
    tb = Toolbar()
    assert tb.active_drag == 'auto'
    assert tb.active_inspect == 'auto'
    assert tb.active_scroll == 'auto'
    assert tb.active_tap == 'auto'
    assert tb.autohide is False


def test_Toolbar_with_autohide() -> None:
    tb = Toolbar(autohide=True)
    assert tb.active_drag == 'auto'
    assert tb.active_inspect == 'auto'
    assert tb.active_scroll == 'auto'
    assert tb.active_tap == 'auto'
    assert tb.autohide is True


def test_BoxEditTool_renderers() -> None:
    t0 = t.BoxEditTool(renderers=[GlyphRenderer(glyph=Block(), data_source=ColumnDataSource())])
    assert check_integrity([t0]) == ValidationIssues(error=[], warning=[])

    t1 = t.BoxEditTool(renderers=[GlyphRenderer(glyph=HBar(), data_source=ColumnDataSource())])
    assert check_integrity([t1]) == ValidationIssues(error=[], warning=[])

    t2 = t.BoxEditTool(renderers=[GlyphRenderer(glyph=Quad(), data_source=ColumnDataSource())])
    assert check_integrity([t2]) == ValidationIssues(error=[], warning=[])

    t3 = t.BoxEditTool(renderers=[GlyphRenderer(glyph=Rect(), data_source=ColumnDataSource())])
    assert check_integrity([t3]) == ValidationIssues(error=[], warning=[])

    t4 = t.BoxEditTool(renderers=[GlyphRenderer(glyph=VBar(), data_source=ColumnDataSource())])
    assert check_integrity([t4]) == ValidationIssues(error=[], warning=[])

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
