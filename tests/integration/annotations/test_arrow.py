from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Arrow
from bokeh.plotting import figure
from selenium.webdriver.common.action_chains import ActionChains

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600

def test_label(output_file_url, selenium, screenshot):

    # Have to specify x/y range as labels aren't included in the plot area solver
    plot = figure(height=HEIGHT, width=WIDTH, x_range=(0,10), y_range=(0,10), tools='')

    arrow1 = Arrow(tail_x=1, tail_y=3, head_x=6, head_y=8,
                   line_color='green', line_alpha=0.7,
                   line_dash='8 4', line_width=5)

    arrow2 = Arrow(tail_x=2, tail_y=2, head_x=7, head_y=7,
                   fill_color='indigo', head_size=50)

    plot.add_annotation(arrow1)
    plot.add_annotation(arrow2)

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)

    # Take screenshot
    assert screenshot.is_valid()
