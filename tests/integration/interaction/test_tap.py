from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure
from bokeh.models import TapTool, CustomJS
from selenium.webdriver.common.action_chains import ActionChains
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration


def make_plot(tools=''):
    plot = figure(height=800, width=1000, tools=tools)
    plot.rect(x=[1, 2], y=[1, 1], width=1, height=1)
    return plot


def click_glyph_at_position(selenium, element, x, y):
    actions = ActionChains(selenium)
    actions.move_to_element_with_offset(element, x, y)
    actions.click_and_hold()  # Works on ff & chrome
    actions.release()
    actions.perform()


def test_tap_with_callback_triggers_alert(output_file_url, selenium):

    # Make plot and add a taptool callback that generates an alert
    plot = make_plot('tap')
    tap = plot.select(dict(type=TapTool))[0]
    tap.callback = CustomJS(code='alert("tapped")')

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Tap the plot and test for alert
    canvas = selenium.find_element_by_tag_name('canvas')
    click_glyph_at_position(selenium, canvas, 250, 400)
    alert = selenium.switch_to_alert()
    assert alert.text == 'tapped'
