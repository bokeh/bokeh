from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure
from bokeh.models import CustomJS, Range1d
from selenium.webdriver.common.action_chains import ActionChains

import pytest
pytestmark = pytest.mark.integration


def make_pan_plot_with_callback(range_min=None, range_max=None):
    x_range = Range1d(0, 3, bounds=(range_min, range_max))
    x_callback = CustomJS(args=dict(x_range=x_range), code="""
        window.get_x_range_start = function() {
            return x_range.get('start');
        }
        window.get_x_range_end = function() {
            return x_range.get('end');
        }
    """)
    x_range.callback = x_callback

    y_range = Range1d(0, 3, bounds=(range_min, range_max))
    y_callback = CustomJS(args=dict(y_range=y_range), code="""
        window.get_y_range_start = function() {
            return y_range.get('start');
        }
        window.get_y_range_end = function() {
            return y_range.get('end');
        }
    """)
    y_range.callback = y_callback

    plot = figure(
        height=400, width=400, tools='pan,reset', x_range=x_range, y_range=y_range
    )
    plot.min_border = 0
    plot.rect(x=[1, 2], y=[1, 1], width=0.9, height=0.9)
    return plot


def pan_plot(selenium, pan_x=None, pan_y=None):
    canvas = selenium.find_element_by_tag_name('canvas')
    actions = ActionChains(selenium)
    actions.move_to_element_with_offset(canvas, 200, 200)
    actions.click_and_hold()
    actions.move_by_offset(pan_x, pan_y)
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
    pan_plot(selenium, pan_x=100, pan_y=100)
    new_range_start = float(selenium.execute_script("""alert(window.get_x_range_start())"""))
    selenium.switch_to_alert().dismiss()  # This is not necessary but assists debugging
    assert new_range_start < initial_start


def test_x_range_does_not_pan_left_of_x_min(output_file_url, selenium):
    x_range_min = -1
    plot = make_pan_plot_with_callback(range_min=x_range_min)
    save(plot)
    selenium.get(output_file_url)

    # Pan plot and test for new range value
    pan_plot(selenium, pan_x=200, pan_y=0)
    new_range_start = float(selenium.execute_script("""alert(window.get_x_range_start())"""))
    selenium.switch_to_alert().dismiss()  # This is not necessary but assists debugging
    assert new_range_start == x_range_min


def test_x_range_does_not_pan_right_of_x_max(output_file_url, selenium):
    x_range_max = 4
    plot = make_pan_plot_with_callback(range_max=x_range_max)
    save(plot)
    selenium.get(output_file_url)

    # Pan plot and test for new range value
    pan_plot(selenium, pan_x=-200, pan_y=0)
    new_range_end = float(selenium.execute_script("""alert(window.get_x_range_end())"""))
    selenium.switch_to_alert().dismiss()  # This is not necessary but assists debugging
    assert new_range_end == x_range_max


def test_y_range_does_not_pan_below_y_min(output_file_url, selenium):
    y_range_min = -1
    plot = make_pan_plot_with_callback(range_min=y_range_min)
    save(plot)
    selenium.get(output_file_url)

    # Pan plot and test for new range value
    pan_plot(selenium, pan_x=50, pan_y=-150)
    new_range_start = float(selenium.execute_script("""alert(window.get_y_range_start())"""))
    selenium.switch_to_alert().dismiss()  # This is not necessary but assists debugging
    assert new_range_start == y_range_min


def test_y_range_does_not_pan_above_y_max(output_file_url, selenium):
    y_range_max = 4
    plot = make_pan_plot_with_callback(range_max=y_range_max)
    save(plot)
    selenium.get(output_file_url)

    # Pan plot and test for new range value
    pan_plot(selenium, pan_x=50, pan_y=150)
    new_range_end = float(selenium.execute_script("""alert(window.get_y_range_end())"""))
    selenium.switch_to_alert().dismiss()  # This is not necessary but assists debugging
    assert new_range_end == y_range_max
