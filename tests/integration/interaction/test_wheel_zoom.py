from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure
from bokeh.models import CustomJS
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains

import pytest
pytestmark = pytest.mark.integration


def make_plot(tools='wheel_zoom, pan, box_select'):
    plot = figure(height=800, width=1000, tools=tools)
    plot.rect(x=[1, 2], y=[1, 1], width=1, height=1)
    return plot


def test_wheel_zoom_is_deselected_by_default(output_file_url, selenium):

    # Make plot and add a taptool callback that generates an alert
    plot = make_plot()

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)

    # Tap the plot and test for alert
    scroll_button = selenium.find_element_by_css_selector('.bk-button-bar-list[type="scroll"] button')
    scroll_classes = scroll_button.get_attribute('class')
    assert 'active' not in scroll_classes
