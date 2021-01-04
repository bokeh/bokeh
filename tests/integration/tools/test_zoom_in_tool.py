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
    ColumnDataSource,
    CustomAction,
    CustomJS,
    Plot,
    Range1d,
    Rect,
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
    plot.add_tools(ZoomInTool())
    code = RECORD("xrstart", "p.x_range.start", final=False) + \
           RECORD("xrend", "p.x_range.end", final=False) + \
           RECORD("yrstart", "p.y_range.start", final=False) + \
           RECORD("yrend", "p.y_range.end")
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(p=plot), code=code)))
    plot.toolbar_sticky = False
    return plot


@pytest.mark.selenium
class Test_ZoomInTool:
    def test_deselected_by_default(self, single_plot_page) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        button = page.get_toolbar_button('zoom-in')
        assert 'active' not in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_clicking_zooms_in(self, single_plot_page) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        button = page.get_toolbar_button('zoom-in')
        button.click()

        page.click_custom_action()

        first = page.results
        assert first['xrstart'] > 0
        assert first['xrend'] < 1
        assert first['yrstart'] > 0
        assert first['yrend'] < 1

        button = page.get_toolbar_button('zoom-in')
        button.click()

        page.click_custom_action()

        second = page.results
        assert second['xrstart'] > first['xrstart']
        assert second['xrend'] < first['xrend']
        assert second['yrstart'] > first['yrstart']
        assert second['yrend'] < first['yrend']

        assert page.has_no_console_errors()
