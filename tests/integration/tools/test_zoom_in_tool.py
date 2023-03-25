#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
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
from bokeh.events import RangesUpdate
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    Plot,
    Range1d,
    Rect,
    ZoomInTool,
)
from tests.support.plugins.project import SinglePlotPage
from tests.support.util.selenium import RECORD

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

def _make_plot():
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
    plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
    plot.add_glyph(source, Rect(x='x', y='y', width=0.9, height=0.9))
    plot.add_tools(ZoomInTool())
    code = RECORD("xrstart", "p.x_range.start", final=False) + \
           RECORD("xrend", "p.x_range.end", final=False) + \
           RECORD("yrstart", "p.y_range.start", final=False) + \
           RECORD("yrend", "p.y_range.end")
    plot.tags.append(CustomJS(name="custom-action", args=dict(p=plot), code=code))
    plot.toolbar_sticky = False
    return plot


@pytest.mark.selenium
class Test_ZoomInTool:
    def test_deselected_by_default(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        [button] = page.get_toolbar_buttons(plot)
        assert 'active' not in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_clicking_zooms_in(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        [button] = page.get_toolbar_buttons(plot)
        button.click()

        page.eval_custom_action()

        first = page.results
        assert first['xrstart'] > 0
        assert first['xrend'] < 1
        assert first['yrstart'] > 0
        assert first['yrend'] < 1

        [button] = page.get_toolbar_buttons(plot)
        button.click()

        page.eval_custom_action()

        second = page.results
        assert second['xrstart'] > first['xrstart']
        assert second['xrend'] < first['xrend']
        assert second['yrstart'] > first['yrstart']
        assert second['yrend'] < first['yrend']

        assert page.has_no_console_errors()

    def test_ranges_udpate(self, single_plot_page: SinglePlotPage) -> None:
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Rect(x='x', y='y', width=0.9, height=0.9))
        plot.add_tools(ZoomInTool())
        code = RECORD("event_name", "cb_obj.event_name", final=False) + \
               RECORD("x0", "cb_obj.x0", final=False) + \
               RECORD("x1", "cb_obj.x1", final=False) + \
               RECORD("y0", "cb_obj.y0", final=False) + \
               RECORD("y1", "cb_obj.y1")
        plot.js_on_event(RangesUpdate, CustomJS(code=code))
        plot.tags.append(CustomJS(name="custom-action", code=""))
        plot.toolbar_sticky = False

        page = single_plot_page(plot)

        [button] = page.get_toolbar_buttons(plot)
        button.click()

        page.eval_custom_action()

        results = page.results
        assert results['event_name'] == "rangesupdate"
        assert results['x0'] > 0
        assert results['x1'] < 1
        assert results['y0'] > 0
        assert results['y1'] < 1

        assert page.has_no_console_errors()
