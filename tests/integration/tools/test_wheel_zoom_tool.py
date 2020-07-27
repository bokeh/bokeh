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
from bokeh._testing.util.selenium import RECORD, SCROLL
from bokeh.models import (
    ColumnDataSource,
    CustomAction,
    CustomJS,
    Plot,
    Range1d,
    Rect,
    WheelZoomTool,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

def _make_plot(dimensions="both"):
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
    plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
    plot.add_glyph(source, Rect(x='x', y='y', width=0.9, height=0.9))
    plot.add_tools(WheelZoomTool(dimensions=dimensions))
    code = RECORD("xrstart", "p.x_range.start", final=False) + \
           RECORD("xrend", "p.x_range.end", final=False) + \
           RECORD("yrstart", "p.y_range.start", final=False) + \
           RECORD("yrend", "p.y_range.end")
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(p=plot), code=code)))
    plot.toolbar_sticky = False
    return plot


@pytest.mark.selenium
class Test_WheelZoomTool:
    def test_deselected_by_default(self, single_plot_page) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        button = page.get_toolbar_button('wheel-zoom')
        assert 'active' not in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_can_be_selected_and_deselected(self, single_plot_page) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        # Check is not active
        button = page.get_toolbar_button('wheel-zoom')
        assert 'active' not in button.get_attribute('class')

        # Click and check is active
        button = page.get_toolbar_button('wheel-zoom')
        button.click()
        assert 'active' in button.get_attribute('class')

        # Click again and check is not active
        button = page.get_toolbar_button('wheel-zoom')
        button.click()
        assert 'active' not in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_zoom_out(self, single_plot_page) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        # First check that scrolling has no effect before the tool is activated
        page.driver.execute_script(SCROLL(200))

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        # Next check that scrolling adjusts the range after the tool is activated
        button = page.get_toolbar_button('wheel-zoom')
        button.click()

        page.driver.execute_script(SCROLL(200))

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] < 0
        assert results['xrend'] > 1
        assert results['yrstart'] < 0
        assert results['yrend'] > 1

        assert page.has_no_console_errors()

    def test_zoom_in(self, single_plot_page) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        # First check that scrolling has no effect before the tool is activated
        page.driver.execute_script(SCROLL(-200))

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        # Next check that scrolling adjusts the range after the tool is activated
        button = page.get_toolbar_button('wheel-zoom')
        button.click()

        page.driver.execute_script(SCROLL(-200))

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] > 0
        assert results['xrend'] < 1
        assert results['yrstart'] > 0
        assert results['yrend'] < 1

        assert page.has_no_console_errors()

    def test_xwheel_zoom(self, single_plot_page) -> None:
        plot = _make_plot(dimensions="width")

        page = single_plot_page(plot)

        # First check that scrolling has no effect before the tool is activated
        page.driver.execute_script(SCROLL(-200))

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        # Next check that scrolling adjusts the x range after the tool is activated
        button = page.get_toolbar_button('wheel-zoom')
        button.click()

        page.driver.execute_script(SCROLL(-200))

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] > 0
        assert results['xrend'] < 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        page.driver.execute_script(SCROLL(400))

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] < 0
        assert results['xrend'] > 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        assert page.has_no_console_errors()

    def test_ywheel_zoom(self, single_plot_page) -> None:
        plot = _make_plot(dimensions="height")

        page = single_plot_page(plot)

        # First check that scrolling has no effect before the tool is activated
        page.driver.execute_script(SCROLL(-200))

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        # Next check that scrolling adjusts the y range after the tool is activated
        button = page.get_toolbar_button('wheel-zoom')
        button.click()

        page.driver.execute_script(SCROLL(-200))

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] > 0
        assert results['yrend'] < 1

        page.driver.execute_script(SCROLL(400))

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] < 0
        assert results['yrend'] > 1

        assert page.has_no_console_errors()
