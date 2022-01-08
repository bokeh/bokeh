#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc. All rights reserved.
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
from bokeh._testing.plugins.project import SinglePlotPage
from bokeh._testing.util.selenium import RECORD, find_matching_element
from bokeh.events import RangesUpdate
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    PanTool,
    Plot,
    Range1d,
    Rect,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

def _make_plot(dimensions="both"):
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
    plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
    plot.add_glyph(source, Rect(x='x', y='y', width=0.9, height=0.9))
    plot.add_tools(PanTool(dimensions=dimensions))
    code = RECORD("xrstart", "p.x_range.start", final=False) + \
           RECORD("xrend", "p.x_range.end", final=False) + \
           RECORD("yrstart", "p.y_range.start", final=False) + \
           RECORD("yrend", "p.y_range.end")
    plot.tags.append(CustomJS(name="custom-action", args=dict(p=plot), code=code))
    plot.toolbar_sticky = False
    return plot

_css = dict(both='pan', width='xpan', height='ypan')


@pytest.mark.selenium
class Test_PanTool:
    @pytest.mark.parametrize('dim', ['both', 'width', 'height'])
    def test_selected_by_default(self, dim, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot(dim)
        page = single_plot_page(plot)

        button = find_matching_element(page.driver, f".bk-tool-icon-{_css[dim]}")
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    @pytest.mark.parametrize('dim', ['both', 'width', 'height'])
    def test_can_be_deselected_and_selected(self, dim, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot(dim)

        page = single_plot_page(plot)

        target = f".bk-tool-icon-{_css[dim]}"

        # Check is active
        button = find_matching_element(page.driver, target)
        assert 'active' in button.get_attribute('class')

        # Click and check is not active
        button = find_matching_element(page.driver, target)
        button.click()
        assert 'active' not in button.get_attribute('class')

        # Click again and check is active
        button = find_matching_element(page.driver, target)
        button.click()
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    @pytest.mark.parametrize('dim', ['both', 'width', 'height'])
    def test_pan_has_no_effect_when_deslected(self, dim, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot(dim)

        page = single_plot_page(plot)

        target = f".bk-tool-icon-{_css[dim]}"

        button = find_matching_element(page.driver, target)
        button.click()

        page.drag_canvas_at_position(plot, 100, 100, 20, 20)

        page.eval_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        assert page.has_no_console_errors()

    def test_pan_updates_both_ranges(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        page.drag_canvas_at_position(plot, 100, 100, 20, 20)

        page.eval_custom_action()

        results = page.results
        assert results['xrstart'] < 0
        assert results['xrend'] < 1
        assert results['yrstart'] > 0
        assert results['yrend'] > 1

        assert page.has_no_console_errors()

    def test_xpan_upates_only_xrange(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot('width')

        page = single_plot_page(plot)

        page.drag_canvas_at_position(plot, 100, 100, 20, 20)

        page.eval_custom_action()

        results = page.results
        assert results['xrstart'] < 0
        assert results['xrend'] < 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        assert page.has_no_console_errors()

    def test_ypan_updates_only_yrange(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot('height')

        page = single_plot_page(plot)

        page.drag_canvas_at_position(plot, 100, 100, 20, 20)

        page.eval_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] > 0
        assert results['yrend'] > 1

        assert page.has_no_console_errors()

    def test_ranges_update(self, single_plot_page: SinglePlotPage) -> None:
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(height=400, width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Rect(x='x', y='y', width=0.9, height=0.9))
        plot.add_tools(PanTool())
        code = RECORD("event_name", "cb_obj.event_name", final=False) + \
               RECORD("x0", "cb_obj.x0", final=False) + \
               RECORD("x1", "cb_obj.x1", final=False) + \
               RECORD("y0", "cb_obj.y0", final=False) + \
               RECORD("y1", "cb_obj.y1")
        plot.js_on_event(RangesUpdate, CustomJS(code=code))
        plot.tags.append(CustomJS(name="custom-action", code=""))
        plot.toolbar_sticky = False

        page = single_plot_page(plot)

        page.drag_canvas_at_position(plot, 100, 100, 20, 20)

        page.eval_custom_action()

        results = page.results
        assert results['event_name'] == "rangesupdate"
        assert results['x0'] < 0
        assert results['x1'] < 1
        assert results['y0'] > 0
        assert results['y1'] > 1

        assert page.has_no_console_errors()
