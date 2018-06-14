from __future__ import absolute_import, print_function

from bokeh.io import save
from bokeh.plotting import figure
from selenium.common.exceptions import StaleElementReferenceException
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration


def make_plot(tools='pan, box_select'):
    plot = figure(height=800, width=1000, tools=tools)
    plot.rect(x=[1, 2], y=[1, 1], width=1, height=1)
    return plot


def test_can_toggle_between_two_pan_tools(output_file_url, selenium):

    # Make plot and add a taptool callback that generates an alert
    plot = make_plot()

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)

    # Get the tools
    pan = selenium.find_element_by_css_selector('.bk-button-bar .bk-tool-icon-pan')
    box_select = selenium.find_element_by_css_selector('.bk-button-bar .bk-tool-icon-box-select')

    # Tap the plot and test for alert
    assert 'active' not in box_select.get_attribute('class')
    assert 'active' in pan.get_attribute('class')
    box_select.click()
    assert 'active' in box_select.get_attribute('class')
    assert 'active' not in pan.get_attribute('class')
