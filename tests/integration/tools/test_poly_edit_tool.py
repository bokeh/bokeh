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
    MultiLine,
    Plot,
    PolyEditTool,
    Range1d,
    Scatter,
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

def _make_plot() -> Plot:
    data = {"xs": [[1, 2], [1.6, 2.45]],
            "ys": [[1, 1], [1.5, 0.75]]}
    source = ColumnDataSource(data)
    plot = Plot(height=400, width=400, x_range=Range1d(0, 3), y_range=Range1d(0, 3), min_border=0)
    renderer = plot.add_glyph(source, MultiLine(xs='xs', ys='ys', line_width=10))
    tool = PolyEditTool(renderers=[renderer])
    psource = ColumnDataSource(dict(x=[], y=[]))
    prenderer = plot.add_glyph(psource, Scatter(x='x', y='y', size=10))
    tool.vertex_renderer = prenderer
    plot.add_tools(tool)
    plot.toolbar.active_multi = tool
    code = RECORD("xs", "source.data.xs", final=False) + RECORD("ys", "source.data.ys")
    plot.tags.append(CustomJS(name="custom-action", args=dict(source=source), code=code))
    plot.toolbar_sticky = False
    return plot

def _make_server_plot(expected) -> tuple[ModifyDoc, Plot, ColumnDataSource]:
    data = {"xs": [[1, 2], [1.6, 2.45]],
            "ys": [[1, 1], [1.5, 0.75]]}
    source = ColumnDataSource(data)
    plot = Plot(height=400, width=400, x_range=Range1d(0, 3), y_range=Range1d(0, 3), min_border=0)
    def modify_doc(doc):
        renderer = plot.add_glyph(source, MultiLine(xs='xs', ys='ys'))
        tool = PolyEditTool(renderers=[renderer])
        psource = ColumnDataSource(dict(x=[], y=[]))
        prenderer = plot.add_glyph(psource, Scatter(x='x', y='y', size=10))
        tool.vertex_renderer = prenderer
        plot.add_tools(tool)
        plot.toolbar.active_multi = tool
        plot.toolbar_sticky = False
        div = Div(text='False')
        def cb(attr, old, new):
            try:
                if cds_data_almost_equal(new, expected):
                    div.text = 'True'
            except ValueError:
                return
        source.on_change('data', cb)
        code = RECORD("matches", "div.text")
        plot.tags.append(CustomJS(name="custom-action", args=dict(div=div), code=code))
        doc.add_root(column(plot, div))
    return modify_doc, plot, source


@pytest.mark.selenium
class Test_PolyEditTool:
    def test_selected_by_default(self, single_plot_page: SinglePlotPage):
        plot = _make_plot()

        page = single_plot_page(plot)

        [button] = page.get_toolbar_buttons(plot)
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_can_be_deselected_and_selected(self, single_plot_page: SinglePlotPage):
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

    def test_double_click_triggers_edit(self, single_plot_page: SinglePlotPage):
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure double clicking shows vertices and edits them
        page.double_click_canvas_at_position(plot, 200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(plot, 298, 298)
        time.sleep(0.5)
        page.double_click_canvas_at_position(plot, 250, 150)
        time.sleep(0.5)
        page.eval_custom_action()

        expected = {'xs': [[1, 2], [1.6, 2.45, 2.027027027027027]],
                    'ys': [[1, 1], [1.5, 0.75, 1.8749999999999998]]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def test_double_click_snaps_to_vertex(self, single_plot_page: SinglePlotPage):
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure double clicking snaps to vertex
        page.double_click_canvas_at_position(plot, 200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(plot, 298, 298)
        time.sleep(0.5)
        page.click_canvas_at_position(plot, 250, 150)
        time.sleep(0.5)
        page.double_click_canvas_at_position(plot, 200, 200)
        time.sleep(0.5)
        page.eval_custom_action()

        expected = {"xs": [[1, 2], [1.6, 2.45, 2.027027027027027, 1.6]],
                    "ys": [[1, 1], [1.5, 0.75, 1.8749999999999998, 1.5]]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def test_drag_moves_vertex(self, single_plot_page: SinglePlotPage):
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure drag moves vertex
        page.double_click_canvas_at_position(plot, 200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(plot, 298, 298)
        time.sleep(0.5)
        page.click_canvas_at_position(plot, 250, 150)
        time.sleep(0.5)
        page.send_keys("\ue00c")  # Escape
        page.drag_canvas_at_position(plot, 250, 150, 70, 50)
        time.sleep(0.5)
        page.eval_custom_action()

        expected = {"xs": [[1, 2], [1.6, 2.45, 2.5945945945945947]],
                    "ys": [[1, 1], [1.5, 0.75, 1.5]]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def test_backspace_removes_vertex(self, single_plot_page: SinglePlotPage):
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure drag moves vertex
        page.double_click_canvas_at_position(plot, 200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(plot, 298, 298)
        time.sleep(0.5)
        page.click_canvas_at_position(plot, 250, 150)
        time.sleep(0.5)
        page.send_keys("\ue00c")  # Escape
        page.click_canvas_at_position(plot, 298, 298)
        time.sleep(0.5)
        page.send_keys("\ue003")  # Escape
        page.eval_custom_action()

        expected = {"xs": [[1, 2], [1.6, 2.027027027027027]],
                    "ys": [[1, 1], [1.5, 1.8749999999999998]]}
        assert cds_data_almost_equal(page.results, expected)
        assert page.has_no_console_errors()

    def test_poly_edit_syncs_to_server(self, bokeh_server_page: BokehServerPage):
        expected = {'xs': [[1, 2], [1.6, 2.45, 2.027027027027027]],
                    'ys': [[1, 1], [1.5, 0.75, 1.8749999999999998]]}
        modify_doc, plot, _ = _make_server_plot(expected)
        page = bokeh_server_page(modify_doc)

        # ensure double clicking shows vertices and edits them
        page.double_click_canvas_at_position(plot, 200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(plot, 298, 298)
        time.sleep(0.5)
        page.double_click_canvas_at_position(plot, 250, 150)
        time.sleep(0.5)

        page.eval_custom_action()
        assert page.results == {"matches": "True"}
        assert page.has_no_console_errors()

    def test_poly_drag_syncs_to_server(self, bokeh_server_page: BokehServerPage):
        expected = {"xs": [[1, 2], [1.6, 2.45, 2.5945945945945947]],
                    "ys": [[1, 1], [1.5, 0.75, 1.5]]}

        modify_doc, plot, _ = _make_server_plot(expected)
        page = bokeh_server_page(modify_doc)

        # ensure drag moves vertex
        page.double_click_canvas_at_position(plot, 200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(plot, 298, 298)
        time.sleep(0.5)
        page.click_canvas_at_position(plot, 250, 150)
        time.sleep(0.5)
        page.send_keys("\ue00c")  # Escape
        page.drag_canvas_at_position(plot, 250, 150, 70, 50)
        time.sleep(0.5)

        page.eval_custom_action()
        assert page.results == {"matches": "True"}
        assert page.has_no_console_errors()

    def test_poly_drag_sync_after_source_edit(self, bokeh_server_page: BokehServerPage):
        expected = {"xs": [[1, 2], [1.6, 2.45, 2.5945945945945947]],
                    "ys": [[1, 1], [1.5, 0.75, 1.5]]}

        modify_doc, plot, ds = _make_server_plot(expected)
        page = bokeh_server_page(modify_doc)

        # ensure drag moves vertex
        page.double_click_canvas_at_position(plot, 200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(plot, 298, 298)
        time.sleep(0.5)
        page.click_canvas_at_position(plot, 250, 150)
        time.sleep(0.5)
        page.send_keys("\ue00c")  # Escape
        time.sleep(0.5)

        def f(): ds.data = dict(ds.data)  # update the data source
        ds.document.add_next_tick_callback(f)
        time.sleep(0.5)

        page.drag_canvas_at_position(plot, 250, 150, 70, 50)
        time.sleep(0.5)

        page.eval_custom_action()
        assert page.results == {"matches": "True"}
        assert page.has_no_console_errors()

    def test_poly_delete_syncs_to_server(self, bokeh_server_page: BokehServerPage) -> None:
        expected = {"xs": [[1, 2], [1.6, 2.027027027027027]],
                    "ys": [[1, 1], [1.5, 1.8749999999999998]]}

        modify_doc, plot, _ = _make_server_plot(expected)
        page = bokeh_server_page(modify_doc)

        # ensure backspace removes vertex
        page.double_click_canvas_at_position(plot, 200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(plot, 298, 298)
        time.sleep(0.5)
        page.click_canvas_at_position(plot, 250, 150)
        time.sleep(0.5)
        page.send_keys("\ue00c")  # Escape
        page.click_canvas_at_position(plot, 298, 298)
        time.sleep(0.5)
        page.send_keys("\ue003")  # Backspace

        page.eval_custom_action()
        assert page.results == {"matches": "True"}
        assert page.has_no_console_errors()
