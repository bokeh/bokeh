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
from bokeh.layouts import column
from bokeh.models import (
    Button,
    Circle,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    DataRange1d,
    Plot,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

def _make_plot(**kw):
    source = ColumnDataSource(dict(x=[1, 2], y1=[0, 1], y2=[10,11]))
    plot = Plot(plot_height=400, plot_width=400, x_range=DataRange1d(), y_range=DataRange1d(**kw), min_border=0)
    plot.add_glyph(source, Circle(x='x', y='y1'))
    glyph = plot.add_glyph(source, Circle(x='x', y='y2'))
    glyph.visible = False
    code = RECORD("yrstart", "p.y_range.start", final=False) + RECORD("yrend", "p.y_range.end")
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(p=plot), code=code)))
    plot.toolbar_sticky = False
    return plot, glyph


@pytest.mark.selenium
class Test_DataRange1d:
    def test_includes_hidden_glyphs_by_default(self, single_plot_page) -> None:
        plot, glyph = _make_plot()

        page = single_plot_page(plot)

        page.click_custom_action()

        results = page.results
        assert results['yrstart'] <= 0
        assert results['yrend'] >= 11

        assert page.has_no_console_errors()

    def test_includes_hidden_glyphs_when_asked(self, single_plot_page) -> None:
        plot, glyph = _make_plot(only_visible=False)

        page = single_plot_page(plot)

        page.click_custom_action()

        results = page.results
        assert results['yrstart'] <= 0
        assert results['yrend'] >= 11

        assert page.has_no_console_errors()

    def test_excludes_hidden_glyphs_when_asked(self, single_plot_page) -> None:
        plot, glyph = _make_plot(only_visible=True)

        page = single_plot_page(plot)

        page.click_custom_action()

        results = page.results
        assert results['yrstart'] <= 0
        assert results['yrend'] < 5

        assert page.has_no_console_errors()


    def test_updates_when_visibility_is_toggled(self, single_plot_page) -> None:
        source = ColumnDataSource(dict(x=[1, 2], y1=[0, 1], y2=[10,11]))
        plot = Plot(plot_height=400, plot_width=400, x_range=DataRange1d(), y_range=DataRange1d(only_visible=True), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y1'))
        glyph = plot.add_glyph(source, Circle(x='x', y='y2'))
        code = RECORD("yrstart", "p.y_range.start", final=False) + RECORD("yrend", "p.y_range.end")
        plot.add_tools(CustomAction(callback=CustomJS(args=dict(p=plot), code=code)))
        plot.toolbar_sticky = False
        button = Button(css_classes=['foo'])
        button.js_on_click(CustomJS(args=dict(glyph=glyph), code="glyph.visible=false"))

        page = single_plot_page(column(plot, button))

        page.click_custom_action()

        results = page.results
        assert results['yrstart'] <= 0
        assert results['yrend'] >= 11

        button = page.driver.find_element_by_css_selector('.foo .bk-btn')
        button.click()

        page.click_custom_action()

        results = page.results
        assert results['yrstart'] <= 0
        assert results['yrend'] < 5

        assert page.has_no_console_errors()
