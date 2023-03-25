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
from bokeh.layouts import column
from bokeh.models import (
    Button,
    Circle,
    ColumnDataSource,
    CustomJS,
    DataRange1d,
    Plot,
)
from tests.support.plugins.project import SinglePlotPage
from tests.support.util.selenium import RECORD, find_element_for

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

def _make_plot(**kw):
    source = ColumnDataSource(dict(x=[1, 2], y1=[0, 1], y2=[10,11]))
    plot = Plot(height=400, width=400, x_range=DataRange1d(), y_range=DataRange1d(**kw), min_border=0)
    plot.add_glyph(source, Circle(x='x', y='y1'))
    glyph = plot.add_glyph(source, Circle(x='x', y='y2'))
    glyph.visible = False
    code = RECORD("yrstart", "p.y_range.start", final=False) + RECORD("yrend", "p.y_range.end")
    plot.tags.append(CustomJS(name="custom-action", args=dict(p=plot), code=code))
    plot.toolbar_sticky = False
    return plot, glyph


@pytest.mark.selenium
class Test_DataRange1d:
    def test_includes_hidden_glyphs_by_default(self, single_plot_page: SinglePlotPage) -> None:
        plot, glyph = _make_plot()

        page = single_plot_page(plot)

        page.eval_custom_action()

        results = page.results
        assert results['yrstart'] <= 0
        assert results['yrend'] >= 11

        assert page.has_no_console_errors()

    def test_includes_hidden_glyphs_when_asked(self, single_plot_page: SinglePlotPage) -> None:
        plot, glyph = _make_plot(only_visible=False)

        page = single_plot_page(plot)

        page.eval_custom_action()

        results = page.results
        assert results['yrstart'] <= 0
        assert results['yrend'] >= 11

        assert page.has_no_console_errors()

    def test_excludes_hidden_glyphs_when_asked(self, single_plot_page: SinglePlotPage) -> None:
        plot, glyph = _make_plot(only_visible=True)

        page = single_plot_page(plot)

        page.eval_custom_action()

        results = page.results
        assert results['yrstart'] <= 0
        assert results['yrend'] < 5

        assert page.has_no_console_errors()


    def test_updates_when_visibility_is_toggled(self, single_plot_page: SinglePlotPage) -> None:
        source = ColumnDataSource(dict(x=[1, 2], y1=[0, 1], y2=[10,11]))
        plot = Plot(height=400, width=400, x_range=DataRange1d(), y_range=DataRange1d(only_visible=True), min_border=0)
        plot.add_glyph(source, Circle(x='x', y='y1'))
        glyph = plot.add_glyph(source, Circle(x='x', y='y2'))
        code = RECORD("yrstart", "p.y_range.start", final=False) + RECORD("yrend", "p.y_range.end")
        plot.tags.append(CustomJS(name="custom-action", args=dict(p=plot), code=code))
        plot.toolbar_sticky = False
        button = Button()
        button.js_on_event('button_click', CustomJS(args=dict(glyph=glyph), code="glyph.visible=false"))

        page = single_plot_page(column(plot, button))

        page.eval_custom_action()

        results = page.results
        assert results['yrstart'] <= 0
        assert results['yrend'] >= 11

        button = find_element_for(page.driver, button, ".bk-btn")
        button.click()

        page.eval_custom_action()

        results = page.results
        assert results['yrstart'] <= 0
        assert results['yrend'] < 5

        assert page.has_no_console_errors()
