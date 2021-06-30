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

# Module under test
import bokeh.plotting._tools as _tools # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__collect_repeated_tools() -> None:
    def count_repeated(tools: str) -> int:
        objs, _ = _tools._resolve_tools(tools)
        return len(list(_tools._collect_repeated_tools(objs)))

    assert count_repeated("pan,xpan,ypan") == 0
    assert count_repeated("xwheel_pan,ywheel_pan") == 0
    assert count_repeated("wheel_zoom,xwheel_zoom,ywheel_zoom") == 0
    assert count_repeated("zoom_in,xzoom_in,yzoom_in") == 0
    assert count_repeated("zoom_out,xzoom_out,yzoom_out") == 0
    assert count_repeated("click,tap") == 0
    assert count_repeated("crosshair") == 0
    assert count_repeated("box_select,xbox_select,ybox_select") == 0
    assert count_repeated("poly_select,lasso_select") == 0
    assert count_repeated("box_zoom,xbox_zoom,ybox_zoom") == 0
    assert count_repeated("hover,save,undo,redo,reset,help") == 0

    assert count_repeated("pan,xpan,xpan") == 1

    assert count_repeated("pan,xpan,ypan,xpan") == 1
    assert count_repeated("pan,xpan,ypan,click,xpan") == 1
    assert count_repeated("pan,xpan,ypan,click,xpan,click") == 2

    assert count_repeated("pan,xpan,ypan,xpan,ypan") == 2
    assert count_repeated("pan,xpan,ypan,click,xpan,ypan") == 2
    assert count_repeated("pan,xpan,ypan,click,xpan,ypan,click") == 3

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
