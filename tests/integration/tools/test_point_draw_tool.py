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
import time

# External imports

# Bokeh imports
from bokeh.models import ColumnDataSource, CustomAction, CustomJS, Plot, Range1d, Circle, PointDrawTool
from bokeh._testing.util.selenium import RECORD

#-----------------------------------------------------------------------------
# Tests
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.bokeh",
)

def _make_plot(num_objects=0, add=True, drag=True):
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
    plot = Plot(plot_height=400, plot_width=400, x_range=Range1d(0, 3), y_range=Range1d(0, 3), min_border=0)
    renderer = plot.add_glyph(source, Circle(x='x', y='y'))
    tool = PointDrawTool(num_objects=num_objects, add=add, drag=drag, renderers=[renderer])
    plot.add_tools(tool)
    plot.toolbar.active_multi = tool 
    code = RECORD("x", "source.data.x") + RECORD("y", "source.data.y")
    plot.add_tools(CustomAction(callback=CustomJS(args=dict(source=source), code=code)))
    plot.toolbar_sticky = False
    return plot


@pytest.mark.integration
@pytest.mark.selenium
class Test_PointDrawTool(object):

    def test_selected_by_default(self, single_plot_page):
        plot = _make_plot()

        page = single_plot_page(plot)

        target = 'bk-tool-icon-point-draw'

        button = page.driver.find_element_by_class_name(target)
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_can_be_deselected_and_selected(self, single_plot_page):
        plot = _make_plot()

        page = single_plot_page(plot)

        target = 'bk-tool-icon-point-draw'

        # Check is active
        button = page.driver.find_element_by_class_name(target)
        assert 'active' in button.get_attribute('class')

        # Click and check is not active
        button = page.driver.find_element_by_class_name(target)
        button.click()
        assert 'active' not in button.get_attribute('class')

        # Click again and check is active
        button = page.driver.find_element_by_class_name(target)
        button.click()
        assert 'active' in button.get_attribute('class')

        assert page.has_no_console_errors()

    def test_click_triggers_draw(self, single_plot_page):
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.click_canvas_at_position(200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.click_custom_action()
        assert page.results == {"x": [1, 2, 1.6216216216216217],
                                "y": [1, 1, 1.5]}

        assert page.has_no_console_errors()
        
    def test_click_does_not_trigger_draw(self, single_plot_page):
        plot = _make_plot(add=False)

        page = single_plot_page(plot)

        # ensure clicking does not add a point
        page.click_canvas_at_position(200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.click_custom_action()
        assert page.results == {"x": [1, 2],
                                "y": [1, 1]}

        assert page.has_no_console_errors()

    def test_drag_moves_point(self, single_plot_page):
        plot = _make_plot()

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.click_canvas_at_position(200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.drag_canvas_at_position(200, 200, 70, 53)
        page.click_custom_action()
        assert page.results == {"x": [1, 2, 2.1891891891891895],
                                "y": [1, 1, 1.1024999999999998]}

        assert page.has_no_console_errors()

    def test_drag_does_not_move_point(self, single_plot_page):
        plot = _make_plot(drag=False)

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.click_canvas_at_position(200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.drag_canvas_at_position(200, 200, 70, 53)
        page.click_custom_action()
        assert page.results == {"x": [1, 2, 1.6216216216216217],
                                "y": [1, 1, 1.5]}

        assert page.has_no_console_errors()

    def test_num_object_limits_points(self, single_plot_page):
        plot = _make_plot(num_objects=2)

        page = single_plot_page(plot)

        # ensure clicking adds a point
        page.click_canvas_at_position(200, 200)
        time.sleep(0.4) # hammerJS click timeout
        page.click_custom_action()
        assert page.results == {"x": [2, 1.6216216216216217],
                                "y": [1, 1.5]}

        assert page.has_no_console_errors()
