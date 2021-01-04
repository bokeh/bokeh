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

# Standard library imports
import time

# External imports
from flaky import flaky

# Bokeh imports
from bokeh._testing.util.compare import cds_data_almost_equal
from bokeh._testing.util.selenium import RECORD
from bokeh.layouts import column
from bokeh.models import (
    Circle,
    ColumnDataSource,
    CustomAction,
    CustomJS,
    Div,
    MultiLine,
    Plot,
    PolyEditTool,
    Range1d,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

def _make_plot():
    data = {"xs": [[1, 2], [1.6, 2.45]],
            "ys": [[1, 1], [1.5, 0.75]]}
    source = ColumnDataSource(data)
    plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 3), y_range=Range1d(0, 3), min_border=0)
    renderer = plot.add_glyph(source, MultiLine(xs='xs', ys='ys', line_width=10))
    tool = PolyEditTool(renderers=[renderer])
    psource = ColumnDataSource(dict(x=[], y=[]))
    prenderer = plot.add_glyph(psource, Circle(x='x', y='y', size=10))
    tool.vertex_renderer = prenderer
    plot.add_tools(tool)
    plot.toolbar.active_multi = tool
    code = RECORD("xs", "source.data.xs", final=False) + RECORD("ys", "source.data.ys")
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(source=source), code=code)))
    plot.toolbar_sticky = False
    return plot

def _make_server_plot(expected):
    def modify_doc(doc):
        data = {"xs": [[1, 2], [1.6, 2.45]],
                "ys": [[1, 1], [1.5, 0.75]]}
        source = ColumnDataSource(data)
        plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 3), y_range=Range1d(0, 3), min_border=0)
        renderer = plot.add_glyph(source, MultiLine(xs='xs', ys='ys'))
        tool = PolyEditTool(renderers=[renderer])
        psource = ColumnDataSource(dict(x=[], y=[]))
        prenderer = plot.add_glyph(psource, Circle(x='x', y='y', size=10))
        tool.vertex_renderer = prenderer
        plot.add_tools(tool)
        plot.toolbar.active_multi = tool
        plot.toolbar_sticky = False
        div = Div(text='False')
        def cb(attr, old, new):
            if cds_data_almost_equal(new, expected):
                div.text = 'True'
        source.on_change('data', cb)
        code = RECORD("matches", "div.text")
        plot.add_tools(CustomAction(callback=CustomJS(args=dict(div=div), code=code)))
        doc.add_root(column(plot, div))
    return modify_doc


@pytest.mark.selenium
class Test_PolyEditTool:
    def _test_selected_by_default(self, single_plot_page):
        plot = _make_plot()

        page = single_plot_page(plot)

        button = page.get_toolbar_button('poly-edit')
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    def _test_can_be_deselected_and_selected(self, single_plot_page):
        plot = _make_plot()

        page = single_plot_page(plot)

        # Check is active
        button = page.get_toolbar_button('poly-edit')
        assert 'active' in button.get_attribute('class')

        # Click and check is not active
        button = page.get_toolbar_button('poly-edit')
        button.click()
        assert 'active' not in button.get_attribute('class')

        # Click again and check is active
        button = page.get_toolbar_button('poly-edit')
        button.click()
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    def _test_double_click_triggers_edit(self, single_plot_page):
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure double clicking shows vertices and edits them
        page.double_click_canvas_at_position(200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(298, 298)
        time.sleep(0.5)
        page.double_click_canvas_at_position(250, 150)
        time.sleep(0.5)
        page.click_custom_action()

        expected = {'xs': [[1, 2], [1.6, 2.45, 2.027027027027027, 1.6]],
                    'ys': [[1, 1], [1.5, 0.75, 1.8749999999999998, 1.5]]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def _test_double_click_snaps_to_vertex(self, single_plot_page):
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure double clicking snaps to vertex
        page.double_click_canvas_at_position(200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(298, 298)
        time.sleep(0.5)
        page.click_canvas_at_position(250, 150)
        time.sleep(0.5)
        page.double_click_canvas_at_position(200, 200)
        time.sleep(0.5)
        page.click_custom_action()

        expected = {"xs": [[1, 2], [1.6, 2.45, 2.027027027027027, 1.6]],
                    "ys": [[1, 1], [1.5, 0.75, 1.8749999999999998, 1.5]]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def _test_drag_moves_vertex(self, single_plot_page):
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure drag moves vertex
        page.double_click_canvas_at_position(200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(298, 298)
        time.sleep(0.5)
        page.click_canvas_at_position(250, 150)
        time.sleep(0.5)
        page.send_keys("\ue00c")  # Escape
        page.drag_canvas_at_position(250, 150, 70, 50)
        time.sleep(0.5)
        page.click_custom_action()

        expected = {"xs": [[1, 2], [1.6, 2.45, 2.5945945945945947]],
                    "ys": [[1, 1], [1.5, 0.75, 1.5]]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def _test_backspace_removes_vertex(self, single_plot_page):
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure drag moves vertex
        page.double_click_canvas_at_position(200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(298, 298)
        time.sleep(0.5)
        page.click_canvas_at_position(250, 150)
        time.sleep(0.5)
        page.send_keys("\ue00c")  # Escape
        page.click_canvas_at_position(298, 298)
        time.sleep(0.5)
        page.send_keys("\ue003")  # Escape
        page.click_custom_action()

        expected = {"xs": [[1, 2], [1.6, 2.027027027027027]],
                    "ys": [[1, 1], [1.5, 1.8749999999999998]]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def _test_poly_edit_syncs_to_server(self, bokeh_server_page):
        expected = {'xs': [[1, 2], [1.6, 2.45, 2.027027027027027]],
                    'ys': [[1, 1], [1.5, 0.75, 1.8749999999999998]]}
        page = bokeh_server_page(_make_server_plot(expected))

        # ensure double clicking shows vertices and edits them
        page.double_click_canvas_at_position(200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(298, 298)
        time.sleep(0.5)
        page.double_click_canvas_at_position(250, 150)
        time.sleep(0.5)

        page.click_custom_action()
        assert page.results == {"matches": "True"}

    @flaky(max_runs=10)
    def _test_poly_drag_syncs_to_server(self, bokeh_server_page):
        expected = {"xs": [[1, 2], [1.6, 2.45, 2.5945945945945947]],
                    "ys": [[1, 1], [1.5, 0.75, 1.5]]}

        page = bokeh_server_page(_make_server_plot(expected))

        # ensure drag moves vertex
        page.double_click_canvas_at_position(200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(298, 298)
        time.sleep(0.5)
        page.click_canvas_at_position(250, 150)
        time.sleep(0.5)
        page.send_keys("\ue00c")  # Escape
        page.drag_canvas_at_position(250, 150, 70, 50)
        time.sleep(0.5)

        page.click_custom_action()
        assert page.results == {"matches": "True"}

    # TODO (bev) Fix up after GH CI switch
    @pytest.mark.skip
    @flaky(max_runs=10)
    def test_poly_delete_syncs_to_server(self, bokeh_server_page) -> None:
        expected = {"xs": [[1, 2], [1.6, 2.027027027027027]],
                    "ys": [[1, 1], [1.5, 1.8749999999999998]]}
        page = bokeh_server_page(_make_server_plot(expected))

        # ensure backspace removes vertex
        page.double_click_canvas_at_position(200, 200)
        time.sleep(0.5)
        page.double_click_canvas_at_position(298, 298)
        time.sleep(0.5)
        page.click_canvas_at_position(250, 150)
        time.sleep(0.5)
        page.send_keys("\ue00c")  # Escape
        page.click_canvas_at_position(298, 298)
        time.sleep(0.5)
        page.send_keys("\ue003")  # Backspace

        page.click_custom_action()
        assert page.results == {"matches": "True"}
