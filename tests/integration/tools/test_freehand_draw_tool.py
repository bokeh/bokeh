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

# Standard library imports
import time

# Bokeh imports
from bokeh.application.handlers.function import ModifyDoc
from bokeh.layouts import column
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    Div,
    FreehandDrawTool,
    MultiLine,
    Plot,
    Range1d,
)
from tests.support.plugins.project import BokehServerPage, SinglePlotPage
from tests.support.util.compare import cds_data_almost_equal
from tests.support.util.selenium import RECORD

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "tests.support.plugins.project",
)

def _make_plot(num_objects=0):
    source = ColumnDataSource(dict(xs=[], ys=[]))
    plot = Plot(height=400, width=400, x_range=Range1d(0, 3), y_range=Range1d(0, 3), min_border=0)
    renderer = plot.add_glyph(source, MultiLine(xs='xs', ys='ys'))
    tool = FreehandDrawTool(num_objects=num_objects, renderers=[renderer])
    plot.add_tools(tool)
    plot.toolbar.active_multi = tool
    code = RECORD("xs", "source.data.xs", final=False) + RECORD("ys", "source.data.ys")
    plot.tags.append(CustomJS(name="custom-action", args=dict(source=source), code=code))
    plot.toolbar_sticky = False
    return plot

def _make_server_plot(expected, num_objects=0) -> tuple[ModifyDoc, Plot]:
    plot = Plot(height=400, width=400, x_range=Range1d(0, 3), y_range=Range1d(0, 3), min_border=0)
    def modify_doc(doc):
        source = ColumnDataSource(dict(xs=[], ys=[]))
        renderer = plot.add_glyph(source, MultiLine(xs='xs', ys='ys'))
        tool = FreehandDrawTool(num_objects=num_objects, renderers=[renderer])
        plot.add_tools(tool)
        plot.toolbar.active_multi = tool
        div = Div(text='False')
        def cb(attr, old, new):
            if cds_data_almost_equal(new, expected):
                div.text = 'True'
        source.on_change('data', cb)
        code = RECORD("matches", "div.text")
        plot.tags.append(CustomJS(name="custom-action", args=dict(div=div), code=code))
        doc.add_root(column(plot, div))
    return modify_doc, plot


@pytest.mark.selenium
class Test_FreehandDrawTool:
    def test_selected_by_default(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        [button] = page.get_toolbar_buttons(plot)
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_can_be_deselected_and_selected(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        # Check is active
        [button] = page.get_toolbar_buttons(plot)
        assert 'active' in button.get_attribute('class')

        # Click and check is not active
        [button] = page.get_toolbar_buttons(plot)
        button.click()
        assert 'active' not in button.get_attribute('class')

        # Click again and check is active
        [button] = page.get_toolbar_buttons(plot)
        button.click()
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_drag_triggers_draw(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.drag_canvas_at_position(plot, 200, 200, 50, 50)
        page.eval_custom_action()

        expected = {'xs': [[1.6216216216216217, 2.027027027027027, 2.027027027027027, 2.027027027027027]],
                    'ys': [[1.5, 1.125, 1.125, 1.125]]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def test_num_object_limits_lines(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot(num_objects=1)

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.drag_canvas_at_position(plot, 200, 200, 50, 50)
        page.drag_canvas_at_position(plot, 100, 100, 100, 100)
        page.eval_custom_action()

        expected = {'xs': [[0.8108108108108109, 1.6216216216216217, 1.6216216216216217, 1.6216216216216217]],
                    'ys': [[2.25, 1.5, 1.5, 1.5]]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def test_freehand_draw_syncs_to_server(self, bokeh_server_page: BokehServerPage) -> None:
        expected = {'xs': [[1.6216216216216217, 2.027027027027027, 2.027027027027027, 2.027027027027027]],
                    'ys': [[1.5, 1.125, 1.125, 1.125]]}

        modify_doc, plot = _make_server_plot(expected)
        page = bokeh_server_page(modify_doc)

        page.drag_canvas_at_position(plot, 200, 200, 50, 50)
        page.eval_custom_action()

        assert page.results == {"matches": "True"}

    def test_line_delete_syncs_to_server(self, bokeh_server_page: BokehServerPage) -> None:
        expected = {'xs': [], 'ys': []}

        modify_doc, plot = _make_server_plot(expected)
        page = bokeh_server_page(modify_doc)

        # ensure clicking adds a point
        page.drag_canvas_at_position(plot, 200, 200, 50, 50)
        page.click_canvas_at_position(plot, 200, 200)
        time.sleep(0.4)  # hammerJS click timeout
        page.send_keys("\ue003")  # Backspace

        page.eval_custom_action()
        assert page.results == {"matches": "True"}
