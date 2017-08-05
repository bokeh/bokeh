from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure
from bokeh.models import CustomJS, Range1d, FactorRange
from selenium.webdriver.common.action_chains import ActionChains
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration


def make_plot(x_range, y_range, tools=''):
    plot = figure(height=800, width=1000, tools=tools,
                  x_range=x_range, y_range=y_range)
    return plot


def click_element_at_position(selenium, element, x, y):
    actions = ActionChains(selenium)
    actions.move_to_element_with_offset(element, x, y)
    actions.click_and_hold()  # Works on ff & chrome
    actions.release()
    actions.perform()


def test_reset_triggers_range1d_callback(output_file_url, selenium):
    x_range = Range1d(start=0, end=10)
    x_range.callback = CustomJS(code='alert("plot reset")')
    y_range = Range1d()

    # Make plot and add a range callback that generates an alert
    plot = make_plot(x_range, y_range, tools='reset')

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Tap the plot and test for alert
    reset_button = selenium.find_element_by_class_name('bk-tool-icon-reset')
    click_element_at_position(selenium, reset_button, 10, 10)
    alert = selenium.switch_to_alert()
    assert alert.text == 'plot reset'


def test_reset_triggers_factorrange_callback(output_file_url, selenium):
    x_range = FactorRange(factors=["a", "b", "c"])
    x_range.callback = CustomJS(code='alert("plot reset")')
    y_range = FactorRange()

    # Make plot and add a range callback that generates an alert
    plot = make_plot(x_range, y_range, tools='reset')

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Tap the plot and test for alert
    reset_button = selenium.find_element_by_class_name('bk-tool-icon-reset')
    click_element_at_position(selenium, reset_button, 10, 10)
    alert = selenium.switch_to_alert()
    assert alert.text == 'plot reset'
