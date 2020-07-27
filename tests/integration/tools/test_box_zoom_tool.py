#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from bokeh._testing.util.selenium import RECORD
from bokeh.models import (
    BoxZoomTool,
    ColumnDataSource,
    CustomAction,
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

def _make_plot(tool):
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
    plot = Plot(plot_height=400, plot_width=450, min_border_right=50, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
    plot.add_glyph(source, Rect(x='x', y='y', width=0.9, height=0.9))
    plot.add_tools(tool)
    code = RECORD("xrstart", "p.x_range.start", final=False) + \
           RECORD("xrend", "p.x_range.end", final=False) + \
           RECORD("yrstart", "p.y_range.start", final=False) + \
           RECORD("yrend", "p.y_range.end")
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(p=plot), code=code)))
    plot.toolbar_sticky = False
    return plot


@pytest.mark.selenium
class Test_BoxZoomTool:
    def test_deselected_by_default_with_pan_tool(self, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool())
        plot.add_tools(PanTool())

        page = single_plot_page(plot)

        button = page.get_toolbar_button('box-zoom')
        assert 'active' not in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_selected_by_default_without_pan_tool(self, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool())

        page = single_plot_page(plot)

        button = page.get_toolbar_button('box-zoom')
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_can_be_selected_and_deselected(self, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool())
        plot.add_tools(PanTool())

        page = single_plot_page(plot)

        # Check is not active
        button = page.get_toolbar_button('box-zoom')
        assert 'active' not in button.get_attribute('class')

        # Click and check is active
        button = page.get_toolbar_button('box-zoom')
        button.click()
        assert 'active' in button.get_attribute('class')

        # Click again and check is not active
        button = page.get_toolbar_button('box-zoom')
        button.click()
        assert 'active' not in button.get_attribute('class')

        assert page.has_no_console_errors()

    @pytest.mark.parametrize('dim', ['both', 'width', 'height'])
    def test_box_zoom_has_no_effect_when_deslected(self, dim, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool(dimensions=dim))

        page = single_plot_page(plot)

        button = page.get_toolbar_button('box-zoom')
        button.click()

        page.drag_canvas_at_position(100, 100, 20, 20)

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        assert page.has_no_console_errors()

    def test_box_zoom_with_corner_origin(self, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool())

        page = single_plot_page(plot)

        page.drag_canvas_at_position(100, 100, 200, 200)

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == pytest.approx(0.25)
        assert results['xrend'] == pytest.approx(0.75)
        assert results['yrstart'] == pytest.approx(0.25)
        assert results['yrend'] == pytest.approx(0.75)

        assert page.has_no_console_errors()

    def test_box_zoom_with_center_origin(self, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool(origin="center"))

        page = single_plot_page(plot)

        page.drag_canvas_at_position(100, 100, 50, 50)

        page.click_custom_action()

        results = page.results
        assert (results['xrstart'] + results['xrend'])/2.0 == pytest.approx(0.25)
        assert (results['yrstart'] + results['yrend'])/2.0 == pytest.approx(0.75)

        assert page.has_no_console_errors()

    def test_box_zoom_with_center_origin_clips_to_range(self, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool(origin="center"))

        page = single_plot_page(plot)

        page.drag_canvas_at_position(200, 200, 500, 500)

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        assert page.has_no_console_errors()

    def test_box_zoom_width_updates_only_xrange(self, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool(dimensions="width"))

        page = single_plot_page(plot)

        page.drag_canvas_at_position(250, 250, 50, 50)

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] > 0.5
        assert results['xrend'] < 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        assert page.has_no_console_errors()

    def test_box_zoom_width_clips_to_xrange(self, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool(dimensions="width"))

        page = single_plot_page(plot)

        page.drag_canvas_at_position(250, 250, 500, 50)

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] > 0.5
        assert results['xrend'] == 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        assert page.has_no_console_errors()

    def test_box_zoom_height_updates_only_yrange(self, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool(dimensions="height"))

        page = single_plot_page(plot)

        page.drag_canvas_at_position(250, 250, 50, 50)

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] > 0
        assert results['yrend'] < 0.5

        assert page.has_no_console_errors()

    def test_box_zoom_height_clips_to_yrange(self, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool(dimensions="height"))

        page = single_plot_page(plot)

        page.drag_canvas_at_position(250, 250, 50, 500)

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] == 0
        assert results['yrend'] < 0.5

        assert page.has_no_console_errors()

    def test_box_zoom_can_match_aspect(self, single_plot_page) -> None:
        plot = _make_plot(BoxZoomTool(match_aspect=True))
        plot.x_range.end = 2

        page = single_plot_page(plot)

        page.drag_canvas_at_position(150, 150, 70, 53)

        page.click_custom_action()

        results = page.results
        assert (results['xrend'] - results['xrstart']) / (results['yrend'] - results['yrstart']) == pytest.approx(2.0)

        assert page.has_no_console_errors()
