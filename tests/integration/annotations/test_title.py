from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Plot, Range1d, LinearAxis, Circle, Column, ColumnDataSource

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600


@pytest.mark.screenshot
def test_the_default_titles_settings_and_ensure_outside_any_axes(output_file_url, selenium, screenshot):
    # Testing title rendering of background and border is covered in the
    # label test. The title added to plot as the primary title
    #  should always be outside axes and other side renderers.

    source = ColumnDataSource(data=dict(x=[1, 2], y=[1, 2]))

    def make_plot(location, title_align, two_axes=True):
        plot = Plot(
            plot_width=400, plot_height=200,
            x_range=Range1d(0, 2), y_range=Range1d(0, 2),
            toolbar_location=None,
            title_location=location,
        )
        plot.title.text = "Title %s - %s" % (location, title_align)
        plot.title.align = title_align
        plot.add_glyph(source, Circle(x='x', y='y', radius=0.4))
        plot.add_layout(LinearAxis(), location)
        if two_axes:
            plot.add_layout(LinearAxis(), location)
        return plot

    layout = Column(
        make_plot('above', 'left', two_axes=False),  # This is a workaround top doesn't like two axes
        make_plot('right', 'right'),
        make_plot('below', 'center'),
        make_plot('left', 'left')
    )

    # Save the plot and start the test
    save(layout)
    selenium.get(output_file_url)

    # Take screenshot
    assert screenshot.is_valid()
