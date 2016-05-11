from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Plot, Range1d, LinearAxis, Title
from selenium.webdriver.common.action_chains import ActionChains

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600

def test_title(output_file_url, selenium, screenshot):

    # Have to specify x/y range as titles aren't included in the plot area solver
    plot = Plot(plot_height=HEIGHT, plot_width=WIDTH,
                x_range=Range1d(0, 10), y_range=Range1d(0, 10),
                toolbar_location=None)

    title1 = Title(x=200, y=400, text="Demo Title",
                   text_font_size='38pt', text_color='red', text_alpha=0.9,
                   text_baseline='bottom', text_align='left',
                   background_fill_color='green', background_fill_alpha=0.2,
                   angle=15, angle_units='deg',
                   render_mode='canvas')

    title2 = Title(x=200, y=300, text="(I'm Canvas)", text_font_size='20pt',
                   border_line_color='black', border_line_width=2, border_line_dash='8 4',
                   render_mode='canvas')

    title3 = Title(x=200, y=200, text="Demo Title",
                   text_font_size='38pt', text_color='red', text_alpha=0.9,
                   text_baseline='bottom', text_align='left',
                   background_fill_color='green', background_fill_alpha=0.2,
                   angle=0.261, angle_units='rad',
                   render_mode='css')

    title4 = Title(x=200, y=100, text="(I'm CSS)", text_font_size='20pt',
                   border_line_color='black', border_line_width=2, border_line_dash='8 4',
                   render_mode='css')

    plot.renderers.extend([title1, title2, title3, title4])

    plot.add_layout(LinearAxis(), 'below')
    plot.add_layout(LinearAxis(), 'left')

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)

    # Take screenshot
    assert screenshot.is_valid()
