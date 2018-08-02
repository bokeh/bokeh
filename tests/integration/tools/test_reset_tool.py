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
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from bokeh.models import (
    Circle, CategoricalScale, ColumnDataSource, CustomAction, CustomJS, DataRange1d, FactorRange, Plot,
    Range1d, Rect, ResetTool, ZoomInTool)
from bokeh._testing.util.selenium import COUNT, RECORD

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

def _make_plot():
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
    plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
    plot.add_glyph(source, Rect(x='x', y='y', width=0.9, height=0.9))
    plot.add_tools(ResetTool(), ZoomInTool())
    code = RECORD("xrstart", "p.x_range.start") + RECORD("xrend", "p.x_range.end") + RECORD("yrstart", "p.y_range.start") + RECORD("yrend", "p.y_range.end")
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(p=plot), code=code)))
    plot.toolbar_sticky = False
    return plot

@pytest.mark.integration
@pytest.mark.selenium
class Test_ResetTool(object):

    def test_deselected_by_default(self, single_plot_page):
        plot = _make_plot()

        page = single_plot_page(plot)

        button = page.get_toolbar_button('reset')
        assert 'active' not in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_clicking_resets_range(self, single_plot_page):
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

    def test_clicking_resets_selection(self, single_plot_page):
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

    def test_reset_triggers_range1d_callbacks(self, single_plot_page):
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 1), y_range=Range1d(0, 1), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y', size=20))
        plot.add_tools(ResetTool(), ZoomInTool())
        plot.x_range.callback = CustomJS(code=COUNT("xrcb"))
        plot.x_range.js_on_change('start', CustomJS(code=COUNT("xrstart")))
        plot.x_range.js_on_change('end', CustomJS(code=COUNT("xrend")))
        plot.y_range.callback = CustomJS(code=COUNT("yrcb"))
        plot.y_range.js_on_change('start', CustomJS(code=COUNT("yrstart")))
        plot.y_range.js_on_change('end', CustomJS(code=COUNT("yrend")))

        page = single_plot_page(plot)

        # Change the ranges using a zoom in tool
        button = page.get_toolbar_button('zoom-in')
        button.click()

        results = page.results
        assert results['xrcb'] == 1
        assert results['xrstart'] == 1
        assert results['xrend'] == 1
        assert results['yrcb'] == 1
        assert results['yrstart'] == 1
        assert results['yrend'] == 1

        # Click the reset tool and check the callback was called
        button = page.get_toolbar_button('reset')
        button.click()

        results = page.results
        assert results['xrcb'] == 2
        assert results['xrstart'] == 2
        assert results['xrend'] == 2
        assert results['yrcb'] == 2
        assert results['yrstart'] == 2
        assert results['yrend'] == 2

        assert page.has_no_console_errors()

    def test_reset_triggers_datarange1d_callbacks(self, single_plot_page):
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        plot = Plot(plot_height=400, plot_width=400, x_range=DataRange1d(), y_range=DataRange1d(), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y', size=20))
        plot.add_tools(ResetTool(), ZoomInTool())
        plot.x_range.callback = CustomJS(code=COUNT("xrcb"))
        plot.x_range.js_on_change('start', CustomJS(code=COUNT("xrstart")))
        plot.x_range.js_on_change('end', CustomJS(code=COUNT("xrend")))
        plot.y_range.callback = CustomJS(code=COUNT("yrcb"))
        plot.y_range.js_on_change('start', CustomJS(code=COUNT("yrstart")))
        plot.y_range.js_on_change('end', CustomJS(code=COUNT("yrend")))

        page = single_plot_page(plot)

        # Change the ranges using a zoom in tool
        button = page.get_toolbar_button('zoom-in')
        button.click()

        # Callbacks have "extra" invocations due to DataRange1d auto-ranging on init.

        results = page.results
        assert results['xrcb'] == 3
        assert results['xrstart'] == 2
        assert results['xrend'] == 2
        assert results['yrcb'] == 3
        assert results['yrstart'] == 2
        assert results['yrend'] == 2

        # Click the reset tool and check the callback was called
        button = page.get_toolbar_button('reset')
        button.click()

        results = page.results
        assert results['xrcb'] == 6
        assert results['xrstart'] == 3
        assert results['xrend'] == 3
        assert results['yrcb'] == 6
        assert results['yrstart'] == 3
        assert results['yrend'] == 3

        assert page.has_no_console_errors()

    def test_reset_triggers_factorrange_callbacks(self, single_plot_page):
        source = ColumnDataSource(dict(x=["a", "b"], y=["a", "a"]))
        plot = Plot(plot_height=400, plot_width=400,
                    x_scale=CategoricalScale(), x_range=FactorRange(factors=["a", "b", "c"]),
                    y_scale=CategoricalScale(), y_range=FactorRange(factors=["a", "b", "c"]), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y', size=20))
        plot.add_tools(ResetTool(), ZoomInTool())
        plot.x_range.callback = CustomJS(code=COUNT("xrcb"))
        plot.x_range.js_on_change('start', CustomJS(code=COUNT("xrstart")))
        plot.x_range.js_on_change('end', CustomJS(code=COUNT("xrend")))
        plot.y_range.callback = CustomJS(code=COUNT("yrcb"))
        plot.y_range.js_on_change('start', CustomJS(code=COUNT("yrstart")))
        plot.y_range.js_on_change('end', CustomJS(code=COUNT("yrend")))

        page = single_plot_page(plot)

        # Change the ranges using a zoom in tool
        button = page.get_toolbar_button('zoom-in')
        button.click()

        results = page.results
        assert results['xrcb'] == 1
        assert results['xrstart'] == 1
        assert results['xrend'] == 1
        assert results['yrcb'] == 1
        assert results['yrstart'] == 1
        assert results['yrend'] == 1

        # Click the reset tool and check the callback was called
        button = page.get_toolbar_button('reset')
        button.click()

        results = page.results
        assert results['xrcb'] == 3
        assert results['xrstart'] == 2
        assert results['xrend'] == 2
        assert results['yrcb'] == 3
        assert results['yrstart'] == 2
        assert results['yrend'] == 2

        assert page.has_no_console_errors()
