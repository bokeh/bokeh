from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Plot, Range1d, Label, LinearAxis
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600


@pytest.mark.screenshot
def test_label(output_file_url, selenium, screenshot):

    # Have to specify x/y range as labels aren't included in the plot area solver
    plot = Plot(plot_height=HEIGHT, plot_width=WIDTH,
                x_range=Range1d(0, 10), y_range=Range1d(0, 10),
                toolbar_location=None)

    label1 = Label(x=1, y=6, x_offset=25, y_offset=25,
                   text="Demo Label",
                   text_font_size='38pt', text_color='red', text_alpha=0.9,
                   text_baseline='bottom', text_align='left',
                   background_fill_color='green', background_fill_alpha=0.2,
                   angle=15, angle_units='deg',
                   render_mode='canvas')

    label2 = Label(x=3, y=5.5, text="(I'm Canvas)", text_font_size='20pt',
                   border_line_color='black', border_line_width=2, border_line_dash='8 4',
                   render_mode='canvas')

    label3 = Label(x=1, y=2, x_offset=25, y_offset=25,
                   text="Demo Label",
                   text_font_size='38pt', text_color='red', text_alpha=0.9,
                   text_baseline='bottom', text_align='left',
                   background_fill_color='green', background_fill_alpha=0.2,
                   angle=0.261, angle_units='rad',
                   render_mode='css')

    label4 = Label(x=3, y=1.0, text="(I'm CSS)", text_font_size='20pt',
                   border_line_color='black', border_line_width=2, border_line_dash='8 4',
                   render_mode='css')

    label_above = Label(
        x=0, y=0, text="Label in above panel", x_units='screen', y_units='screen',
        text_font_size='38pt', text_color='firebrick', text_alpha=0.9,
    )

    label_left = Label(
        x=0, y=0, text="Label in left panel",
        x_units='screen', y_units='screen', angle=90, angle_units='deg',
        text_font_size='18pt', text_color='firebrick', text_alpha=0.9,
        background_fill_color='aliceblue', text_baseline='top',
    )

    plot.add_layout(LinearAxis(), 'below')
    plot.add_layout(LinearAxis(), 'left')

    plot.add_layout(label1)
    plot.add_layout(label2)
    plot.add_layout(label3)
    plot.add_layout(label4)
    plot.add_layout(label_above, 'above')
    plot.add_layout(label_left, 'left')

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Take screenshot
    assert screenshot.is_valid()
