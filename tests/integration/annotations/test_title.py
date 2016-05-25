from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Plot, Range1d, Title, LinearAxis

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600


def test_title(output_file_url, selenium, screenshot):

    # Have to specify x/y range as labels aren't included in the plot area solver
    plot = Plot(plot_height=HEIGHT, plot_width=WIDTH,
                x_range=Range1d(0, 10), y_range=Range1d(0, 10),
                toolbar_location=None)

    title1 = Title(text="Demo Label", title_align='left', title_padding=100,
                   text_font_size='38pt', text_color='red', text_alpha=0.9,
                   background_fill_color='green', background_fill_alpha=0.2,
                   render_mode='canvas')

    title2 = Title(text="(I'm Canvas)", title_align='left', title_padding=100,
                   text_font_size='20pt', border_line_color='black',
                   border_line_width=2, border_line_dash='8 4', render_mode='canvas')

    title3 = Title(text="Demo Label", title_align='left', title_padding=100,
                   text_font_size='38pt', text_color='red', text_alpha=0.9,
                   background_fill_color='green', background_fill_alpha=0.2,
                   render_mode='css')

    title4 = Title(text="(I'm CSS)", text_font_size='20pt',
                   border_line_color='black', border_line_width=2,
                   border_line_dash='8 4', render_mode='css')

    plot.add_layout(LinearAxis(), 'below')
    plot.add_layout(LinearAxis(), 'left')

    plot.add_layout(title1, 'left')
    plot.add_layout(title2, 'below')
    plot.add_layout(title3, 'above')
    plot.add_layout(title4, 'right')

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)

    # Take screenshot
    assert screenshot.is_valid()
