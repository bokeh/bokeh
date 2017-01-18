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


def get_non_stale_pan_buttons(selenium):
    used = False
    attempts = 0
    while attempts < 4 and not used:
        try:
            pan_buttons = selenium.find_elements_by_css_selector('.bk-button-bar-list[type="pan"] .bk-toolbar-button')
            pan_buttons[0].get_attribute('class')
            used = True
        except StaleElementReferenceException:
            print('Got a StaleElementReference, retrying %s more times' % (4 - attempts))
        except IndexError:
            print('No pan buttons availabe yet')
        finally:
            attempts += 1
    return pan_buttons


def test_can_toggle_between_two_pan_tools(output_file_url, selenium):

    # Make plot and add a taptool callback that generates an alert
    plot = make_plot()

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Tap the plot and test for alert
    pan_buttons = get_non_stale_pan_buttons(selenium)
    pan = pan_buttons[0]
    box_select = pan_buttons[1]
    assert 'active' not in box_select.get_attribute('class')
    assert 'active' in pan.get_attribute('class')

    box_select.click()

    pan_buttons = get_non_stale_pan_buttons(selenium)
    pan = pan_buttons[0]
    box_select = pan_buttons[1]
    assert 'active' in box_select.get_attribute('class')
    assert 'active' not in pan.get_attribute('class')
