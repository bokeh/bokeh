from __future__ import absolute_import, print_function

from bokeh.io import save
from bokeh.plotting import figure
from selenium.common.exceptions import StaleElementReferenceException

import pytest
pytestmark = pytest.mark.integration


def make_plot(tools='wheel_zoom, pan, box_select'):
    plot = figure(height=800, width=1000, tools=tools)
    plot.rect(x=[1, 2], y=[1, 1], width=1, height=1)
    return plot


def get_non_stale_scroll_button(selenium):
    used = False
    attempts = 0
    while attempts < 4 and not used:
        try:
            scroll_button = selenium.find_element_by_css_selector('.bk-button-bar-list[type="scroll"] button')
            scroll_button.get_attribute('class')
            used = True
        except StaleElementReferenceException:
            print('Got a StaleElementReference, retrying %s more times' % 4 - attempts)
            attempts += 1
    return scroll_button


def test_wheel_zoom_is_deselected_by_default(output_file_url, selenium):

    # Make plot and add a taptool callback that generates an alert
    plot = make_plot()

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)

    # Tap the plot and test for alert
    scroll_button = get_non_stale_scroll_button(selenium)
    scroll_classes = scroll_button.get_attribute('class')
    assert 'active' not in scroll_classes


def test_wheel_zoom_can_be_selected(output_file_url, selenium):

    # Make plot and add a taptool callback that generates an alert
    plot = make_plot()

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)

    # Tap the plot and test for alert
    scroll_button = get_non_stale_scroll_button(selenium)
    scroll_button.click()
    scroll_classes = scroll_button.get_attribute('class')
    assert 'active' in scroll_classes


def test_wheel_zoom_can_be_selected_and_deselected(output_file_url, selenium):

    # Make plot and add a taptool callback that generates an alert
    plot = make_plot()

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)

    # Check is not active
    scroll_button = get_non_stale_scroll_button(selenium)
    scroll_classes = scroll_button.get_attribute('class')
    assert 'active' not in scroll_classes
    # Click and check is active
    scroll_button = get_non_stale_scroll_button(selenium)
    scroll_button.click()
    scroll_classes = scroll_button.get_attribute('class')
    assert 'active' in scroll_classes
    # Click again and check is not active
    scroll_button = get_non_stale_scroll_button(selenium)
    scroll_button.click()
    scroll_classes = scroll_button.get_attribute('class')
    assert 'active' not in scroll_classes
