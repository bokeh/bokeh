from __future__ import absolute_import

import io
import os

from jinja2 import Template

from bokeh.util.string import decode_utf8
from bokeh.embed import file_html
from bokeh.models import Plot, Range1d, Circle, LinearAxis
from bokeh.resources import INLINE
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600

@pytest.mark.screenshot
def test_no_border_or_background_fill(output_file_url, selenium, screenshot):

    # Have body background-color that should appear through the no-fill plot
    template = Template("""
    <!doctype html>
    <html lang="en">
    <head>
        {{ bokeh_js }}
        {{ bokeh_css}}
        <style>
            body { background-color: lightblue; }
        </style>
    </head>
    <body>
        {{ plot_script }}
        {{ plot_div }}
    </body>
    </html>
    """)

    plot = Plot(plot_height=HEIGHT, plot_width=WIDTH,
                x_range=Range1d(0, 10), y_range=Range1d(0, 10),
                toolbar_location=None)

    # This is the no-fill that we're testing
    plot.background_fill_color = None
    plot.border_fill_color = None

    plot.add_glyph(Circle(x=3, y=3, size=50, fill_color='#ffffff'))
    plot.add_glyph(Circle(x=6, y=6, size=50, fill_color='#ffffff'))

    plot.add_layout(LinearAxis(major_label_text_color='#ffffff',
                               major_label_text_font_size="30pt"),
                    'left')
    plot.add_layout(LinearAxis(major_label_text_color='#ffffff',
                               major_label_text_font_size="30pt"),
                    'below')

    html = file_html(plot, INLINE, template=template)

    # filename has to match test function + '.html' light
    filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "test_no_border_or_background_fill.html")

    with io.open(filepath, "w", encoding="utf-8") as f:
        f.write(decode_utf8(html))

    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)
    screenshot.assert_is_valid()
