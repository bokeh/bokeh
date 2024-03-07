#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. All rights reserved.
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
    Circle,
    ColumnDataSource,
    CustomJS,
    Div,
    Plot,
    PointDrawTool,
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

def _make_plot(num_objects=0, add=True, drag=True):
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
    plot = Plot(height=400, width=400, x_range=Range1d(0, 3), y_range=Range1d(0, 3), min_border=0)
    renderer = plot.add_glyph(source, Circle(x='x', y='y'))
    tool = PointDrawTool(num_objects=num_objects, add=add, drag=drag, renderers=[renderer])
    plot.add_tools(tool)
    plot.toolbar.active_multi = tool
    code = RECORD("x", "source.data.x", final=False) + RECORD("y", "source.data.y")
    plot.tags.append(CustomJS(name="custom-action", args=dict(source=source), code=code))
    plot.toolbar_sticky = False
    return plot

def _make_server_plot(expected) -> tuple[ModifyDoc, Plot]:
    plot = Plot(height=400, width=400, x_range=Range1d(0, 3), y_range=Range1d(0, 3), min_border=0)
    def modify_doc(doc):
        source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
        renderer = plot.add_glyph(source, Circle(x='x', y='y'))
        tool = PointDrawTool(renderers=[renderer])
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
class Test_PointDrawTool:
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

    def test_click_triggers_draw(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.click_canvas_at_position(plot, 200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.eval_custom_action()

        expected = {"x": [1, 2, 1.6216216216216217],
                    "y": [1, 1, 1.5]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def test_click_does_not_trigger_draw(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot(add=False)

        page = single_plot_page(plot)

        # ensure clicking does not add a point
        page.click_canvas_at_position(plot, 200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.eval_custom_action()

        expected = {"x": [1, 2], "y": [1, 1]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def test_drag_moves_point(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.click_canvas_at_position(plot, 200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.drag_canvas_at_position(plot, 200, 200, 70, 53)
        page.eval_custom_action()

        expected = {"x": [1, 2, 2.1891891891891895],
                    "y": [1, 1, 1.1024999999999998]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def test_drag_does_not_move_point(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot(drag=False)

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.click_canvas_at_position(plot, 200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.drag_canvas_at_position(plot, 200, 200, 70, 53)
        page.eval_custom_action()

        expected = {"x": [1, 2, 1.6216216216216217],
                    "y": [1, 1, 1.5]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def test_num_object_limits_points(self, single_plot_page: SinglePlotPage) -> None:
        plot = _make_plot(num_objects=2)

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.click_canvas_at_position(plot, 200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.eval_custom_action()

        expected = {"x": [2, 1.6216216216216217],
                    "y": [1, 1.5]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def test_point_draw_syncs_to_server(self, bokeh_server_page: BokehServerPage) -> None:
        expected = {"x": [1, 2, 1.6216216216216217],
                    "y": [1, 1, 1.5]}

        modify_doc, plot = _make_server_plot(expected)
        page = bokeh_server_page(modify_doc)

        page.click_canvas_at_position(plot, 200, 200)
        time.sleep(0.5) # hammerJS click timeout

        page.eval_custom_action()
        assert page.results == {"matches": "True"}

    def test_point_drag_syncs_to_server(self, bokeh_server_page: BokehServerPage) -> None:
        expected = {"x": [1, 2, 2.1891891891891895],
                    "y": [1, 1, 1.1024999999999998]}

        modify_doc, plot = _make_server_plot(expected)
        page = bokeh_server_page(modify_doc)

        page.click_canvas_at_position(plot, 200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.drag_canvas_at_position(plot, 200, 200, 70, 53)

        page.eval_custom_action()
        assert page.results == {"matches": "True"}

    def test_point_delete_syncs_to_server(self, bokeh_server_page: BokehServerPage) -> None:
        expected = {"x": [1, 2],
                    "y": [1, 1]}

        modify_doc, plot = _make_server_plot(expected)
        page = bokeh_server_page(modify_doc)

        page.click_canvas_at_position(plot, 200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.click_canvas_at_position(plot, 200, 200)
        time.sleep(0.4)  # hammerJS click timeout
        page.send_keys("\ue003")  # Backspace
        time.sleep(0.4)  # hammerJS click timeout

        page.eval_custom_action()
        assert page.results == {"matches": "True"}
