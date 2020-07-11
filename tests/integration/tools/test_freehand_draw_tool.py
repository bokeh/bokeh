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
    ColumnDataSource,
    CustomAction,
    CustomJS,
    Div,
    FreehandDrawTool,
    MultiLine,
    Plot,
    Range1d,
)

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
)

def _make_plot(num_objects=0):
    source = ColumnDataSource(dict(xs=[], ys=[]))
    plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 3), y_range=Range1d(0, 3), min_border=0)
    renderer = plot.add_glyph(source, MultiLine(xs='xs', ys='ys'))
    tool = FreehandDrawTool(num_objects=num_objects, renderers=[renderer])
    plot.add_tools(tool)
    plot.toolbar.active_multi = tool
    code = RECORD("xs", "source.data.xs", final=False) + RECORD("ys", "source.data.ys")
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(source=source), code=code)))
    plot.toolbar_sticky = False
    return plot

def _make_server_plot(expected, num_objects=0):
    def modify_doc(doc):
        source = ColumnDataSource(dict(xs=[], ys=[]))
        plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 3), y_range=Range1d(0, 3), min_border=0)
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
        plot.add_tools(CustomAction(callback=CustomJS(args=dict(div=div), code=code)))
        doc.add_root(column(plot, div))
    return modify_doc


@pytest.mark.selenium
class Test_FreehandDrawTool:
    def test_selected_by_default(self, single_plot_page) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        button = page.get_toolbar_button('freehand-draw')
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_can_be_deselected_and_selected(self, single_plot_page) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        # Check is active
        button = page.get_toolbar_button('freehand-draw')
        assert 'active' in button.get_attribute('class')

        # Click and check is not active
        button = page.get_toolbar_button('freehand-draw')
        button.click()
        assert 'active' not in button.get_attribute('class')

        # Click again and check is active
        button = page.get_toolbar_button('freehand-draw')
        button.click()
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_drag_triggers_draw(self, single_plot_page) -> None:
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.drag_canvas_at_position(200, 200, 50, 50)
        page.click_custom_action()

        expected = {'xs': [[1.6216216216216217, 2.027027027027027, 2.027027027027027, 2.027027027027027]],
                    'ys': [[1.5, 1.125, 1.125, 1.125]]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    def test_num_object_limits_lines(self, single_plot_page) -> None:
        plot = _make_plot(num_objects=1)

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.drag_canvas_at_position(200, 200, 50, 50)
        page.drag_canvas_at_position(100, 100, 100, 100)
        page.click_custom_action()

        expected = {'xs': [[0.8108108108108109, 1.6216216216216217, 1.6216216216216217, 1.6216216216216217]],
                    'ys': [[2.25, 1.5, 1.5, 1.5]]}
        assert cds_data_almost_equal(page.results, expected)

        assert page.has_no_console_errors()

    @flaky(max_runs=10)
    def test_freehand_draw_syncs_to_server(self, bokeh_server_page) -> None:
        expected = {'xs': [[1.6216216216216217, 2.027027027027027, 2.027027027027027, 2.027027027027027]],
                    'ys': [[1.5, 1.125, 1.125, 1.125]]}

        page = bokeh_server_page(_make_server_plot(expected))

        page.drag_canvas_at_position(200, 200, 50, 50)
        page.click_custom_action()

        assert page.results == {"matches": "True"}

    @flaky(max_runs=10)
    def test_line_delete_syncs_to_server(self, bokeh_server_page) -> None:
        expected = {'xs': [], 'ys': []}

        page = bokeh_server_page(_make_server_plot(expected))

        # ensure clicking adds a point
        page.drag_canvas_at_position(200, 200, 50, 50)
        page.click_canvas_at_position(200, 200)
        time.sleep(0.4)  # hammerJS click timeout
        page.send_keys("\ue003")  # Backspace

        page.click_custom_action()
        assert page.results == {"matches": "True"}
