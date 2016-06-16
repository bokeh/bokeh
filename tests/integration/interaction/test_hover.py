from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import HoverTool
from bokeh.plotting import figure
from selenium.webdriver.common.action_chains import ActionChains
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600


def hover_at_position(selenium, canvas, x, y):
    actions = ActionChains(selenium)
    actions.move_to_element_with_offset(canvas, x, y)
    actions.perform()


@pytest.mark.screenshot
def test_hover_changes_color(output_file_url, selenium, screenshot):

    # Make plot and add a taptool callback that generates an alert
    plot = figure(height=HEIGHT, width=WIDTH, tools='', toolbar_location="above")
    rect = plot.rect(
        x=[1, 2], y=[1, 1],
        width=1, height=1,
        fill_color='cyan', hover_fill_color='magenta',
        line_color=None,   hover_line_color=None
    )
    plot.add_tools(HoverTool(tooltips=None, renderers=[rect]))

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Hover over plot and take screenshot
    canvas = selenium.find_element_by_tag_name('canvas')
    hover_at_position(selenium, canvas, WIDTH * 0.33, HEIGHT * 0.5)
    assert screenshot.is_valid()
