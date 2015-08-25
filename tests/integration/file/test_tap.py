from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure
from bokeh.models import Plot, Range1d, ColumnDataSource, Rect, WheelZoomTool
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains

from ..utils import value_to_be_present_in_datahash

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


def test_select_rectangle_glyph(output_file_url, selenium):

    save(make_plot('tap'))
    selenium.get(output_file_url)
    canvas = selenium.find_element_by_tag_name('canvas')

    wait = WebDriverWait(selenium, 10)
    # Initial plot
    wait.until(value_to_be_present_in_datahash(canvas, '0c2cc32a505f9b16f1dc87bf8e9ac527'))
    # Click left
    click_glyph_at_position(selenium, canvas, 250, 400)
    wait.until(value_to_be_present_in_datahash(canvas, '72b9da54517f68b2895b9da28c91400f'))
    # Click right
    click_glyph_at_position(selenium, canvas, 750, 400)
    wait.until(value_to_be_present_in_datahash(canvas, '36d1329732f484e483d48eac88434828'))
    # CLick off glyph to reset plot 
    # TODO: why isn't this the same as first hash?
    click_glyph_at_position(selenium, canvas, 0, 0)
    wait.until(value_to_be_present_in_datahash(canvas, '1ea37ccb5cfbc9146bf50764a423bcc9'))
