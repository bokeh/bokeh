from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import ColumnDataSource, Plot, Rect, Range1d, LogAxis
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration

@pytest.mark.screenshot
def test_rect_rendering_with_log_axis(output_file_url, selenium, screenshot):

    plot = Plot(plot_height=400, plot_width=400,
       x_range=Range1d(0,30), y_range=Range1d(1,100),
       y_mapper_type="log")

    x = [10, 20]
    y = [10, 20]

    source = ColumnDataSource(data=dict(x=[(x[0]+x[1])/2], y=[(y[0]+y[1])/2], width=[x[1]-x[0]], height=[y[1]-y[0]]))
    plot.add_glyph(source, Rect(x='x', y='y', width='width', height='height'))

    plot.add_layout(LogAxis(), "left")

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)
    assert screenshot.is_valid()
