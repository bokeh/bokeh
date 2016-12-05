from __future__ import absolute_import

from bokeh.core.properties import field
from bokeh.io import save
from bokeh.models import (
    ColumnDataSource, Plot, Circle, Legend, LegendItem, Range1d
)
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600


@pytest.mark.screenshot
def test_legend_powered_by_source(output_file_url, selenium, screenshot):
    plot = Plot(
        height=HEIGHT, width=WIDTH,
        x_range=Range1d(0, 4), y_range=Range1d(0, 4),
        toolbar_location=None
    )
    source = ColumnDataSource(dict(
        x=[1, 2, 3],
        y=[1, 2, 3],
        color=['red', 'green', 'blue'],
        label=['Color Red', 'Color Green', 'Color Blue'],
    ))
    circle = Circle(x='x', y='y', fill_color='color', size=20)
    circle_renderer = plot.add_glyph(source, circle)
    plot.add_layout(Legend(items=[LegendItem(label=field('label'), renderers=[circle_renderer])]))

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Take screenshot
    assert screenshot.is_valid()
