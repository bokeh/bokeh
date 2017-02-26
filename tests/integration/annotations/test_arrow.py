from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Arrow, OpenHead, NormalHead, VeeHead
from bokeh.plotting import figure
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600

@pytest.mark.screenshot
def test_arrow(output_file_url, selenium, screenshot):

    # Have to specify x/y range as labels aren't included in the plot area solver
    plot = figure(height=HEIGHT, width=WIDTH, x_range=(0,10), y_range=(0,10), tools='', toolbar_location="above")

    arrow1 = Arrow(x_start=1, y_start=3, x_end=6, y_end=8,
                   line_color='green', line_alpha=0.7,
                   line_dash='8 4', line_width=5, end=OpenHead()
                   )
    arrow1.end.line_width=8

    arrow2 = Arrow(x_start=2, y_start=2, x_end=7, y_end=7,
                   start=NormalHead(), end=VeeHead()
                   )
    arrow2.start.fill_color = 'indigo'
    arrow2.end.fill_color = 'orange'
    arrow2.end.size = 50

    plot.add_layout(arrow1)
    plot.add_layout(arrow2)

     # test arrow body clipping
    plot.add_layout(Arrow(start=VeeHead(line_width=1, fill_color="white"), x_start=6, y_start=4, x_end=8, y_end=5, line_width=10))
    plot.add_layout(Arrow(start=NormalHead(line_width=1, fill_color="white"), x_start=6, y_start=3, x_end=8, y_end=4, line_width=10))
    plot.add_layout(Arrow(start=OpenHead(line_width=1), x_start=6, y_start=2, x_end=8, y_end=3, line_width=10))

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Take screenshot
    assert screenshot.is_valid()
