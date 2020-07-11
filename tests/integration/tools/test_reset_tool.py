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
    Circle,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    Plot,
    Range1d,
    Rect,
    ResetTool,
    ZoomInTool,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

def _make_plot():
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
    plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
    plot.add_glyph(source, Rect(x='x', y='y', width=0.9, height=0.9))
    plot.add_tools(ResetTool(), ZoomInTool())
    code = RECORD("xrstart", "p.x_range.start", final=False) + \
           RECORD("xrend", "p.x_range.end", final=False) + \
           RECORD("yrstart", "p.y_range.start", final=False) + \
           RECORD("yrend", "p.y_range.end")
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(p=plot), code=code)))
    plot.toolbar_sticky = False
    return plot


@pytest.mark.selenium
class Test_ResetTool:
    def test_deselected_by_default(self, single_plot_page) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        button = page.get_toolbar_button('reset')
        assert 'active' not in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_clicking_resets_range(self, single_plot_page) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        # Change the ranges using a zoom in tool
        button = page.get_toolbar_button('zoom-in')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] != 0
        assert results['xrend'] != 1
        assert results['yrstart'] != 0
        assert results['yrend'] != 1

        # Click the reset tool and check the ranges are restored
        button = page.get_toolbar_button('reset')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results['xrstart'] == 0
        assert results['xrend'] == 1
        assert results['yrstart'] == 0
        assert results['yrend'] == 1

        assert page.has_no_console_errors()

    def test_clicking_resets_selection(self, single_plot_page) -> None:
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        source.selected.indices = [0]
        source.selected.line_indices = [0]

        # XXX (bev) string key for multiline_indices seems questionable
        source.selected.multiline_indices = {"0": [0]}

        plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y', size=20))
        plot.add_tools(ResetTool())
        code = \
            RECORD("indices", "s.selected.indices") + \
            RECORD("line_indices", "s.selected.line_indices") + \
            RECORD("multiline_indices", "s.selected.multiline_indices")
        plot.add_tools(CustomAction(callback=CustomJS(args=dict(s=source), code=code)))
        plot.toolbar_sticky = False

        page = single_plot_page(plot)

        # Verify selections are non empty
        page.click_custom_action()

        results = page.results
        assert results['indices'] == [0]
        assert results['line_indices'] == [0]
        assert results['multiline_indices'] == {"0": [0]} # XXX (bev) string key

        # Click the reset tool and check the selections are restored
        button = page.get_toolbar_button('reset')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results['indices'] == []
        assert results['line_indices'] == []
        assert results['multiline_indices'] == {}

        assert page.has_no_console_errors()
