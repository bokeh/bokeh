from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Label
from bokeh.plotting import figure
from selenium.webdriver.common.action_chains import ActionChains

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600

def test_label(output_file_url, selenium, screenshot):

    # Have to specify x/y range as labels aren't included in the plot area solver
    plot = figure(height=HEIGHT, width=WIDTH, x_range=(0,10), y_range=(0,10), tools='')

    label1 = Label(x=1, y=8, x_offset=25, y_offset=25,
                   text=["Demo Label"],
                   text_font_size='38pt', text_color='red', text_alpha=0.9,
                   text_baseline='bottom', text_align='left',
                   background_fill_color='green', background_fill_alpha=0.2,
                   render_mode='canvas')

    label2 = Label(x=3, y=7.5, text=["(I'm Canvas)"], text_font_size='20pt',
                   border_line_color='black', border_line_width=2, border_line_dash='8 4',
                   render_mode='canvas')

    label3 = Label(x=1, y=4, x_offset=25, y_offset=25,
                   text=["Demo Label"],
                   text_font_size='38pt', text_color='red', text_alpha=0.9,
                   text_baseline='bottom', text_align='left',
                   background_fill_color='green', background_fill_alpha=0.2,
                   render_mode='css')

    label4 = Label(x=3, y=3.5, text=["(I'm CSS)"], text_font_size='20pt',
                   border_line_color='black', border_line_width=2, border_line_dash='8 4',
                   render_mode='css')

    plot.add_label(label1)
    plot.add_label(label2)
    plot.add_label(label3)
    plot.add_label(label4)

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)

    # Take screenshot
    assert screenshot.is_valid()
