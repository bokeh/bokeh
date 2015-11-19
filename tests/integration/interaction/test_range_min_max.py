from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure
from bokeh.models import CustomJS, Range1d
from selenium.webdriver.common.action_chains import ActionChains

import pytest
pytestmark = pytest.mark.integration


def make_pan_plot_with_callback(x_range_min=None):
    x_range = Range1d(0, 3, min=x_range_min)
    x_range.callback = CustomJS(args=dict(x_range=x_range), code="""
        window.get_x_range_start = function() {
            return x_range.get('start');
        }
    """)
    plot = figure(height=300, width=300, tools='pan', x_range=x_range, y_range=Range1d(0, 3))
    plot.rect(x=[1, 2], y=[1, 1], width=0.9, height=0.9)
    return plot


def pan_plot(selenium):
    canvas = selenium.find_element_by_tag_name('canvas')
    actions = ActionChains(selenium)
    actions.move_to_element_with_offset(canvas, 200, 200)
    actions.click_and_hold()
    actions.move_by_offset(100, 0)
    actions.release()
    actions.perform()


def test_range_with_callback_triggers_alert(output_file_url, selenium):
    # Simple test to ensure range callbacks are working
    # Rest of tests in this file depend on range callback.

    plot = make_pan_plot_with_callback()
    initial_start = plot.x_range.start
    save(plot)
    selenium.get(output_file_url)

    # Pan plot and test for new range value
    pan_plot(selenium)
    new_range_start = float(selenium.execute_script("""alert(window.get_x_range_start())"""))
    selenium.switch_to_alert().dismiss()  # This is not necessary but assists debugging
    assert new_range_start < initial_start


def test_x_range_does_not_pan_left_of_min(output_file_url, selenium):
    # Simple test to ensure range callbacks are working
    # Rest of tests in this file depend on range callback.

    x_range_min = -1
    plot = make_pan_plot_with_callback(x_range_min=x_range_min)
    save(plot)
    selenium.get(output_file_url)

    # Pan plot and test for new range value
    pan_plot(selenium)
    new_range_start = float(selenium.execute_script("""alert(window.get_x_range_start())"""))
    selenium.switch_to_alert().dismiss()  # This is not necessary but assists debugging
    assert new_range_start == x_range_min
