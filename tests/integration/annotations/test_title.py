from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Plot, Range1d, Title, LinearAxis

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600


@pytest.mark.screenshot
def test_the_default_titles_settings_and_ensure_outside_any_axes(output_file_url, selenium, screenshot):
    # Testing title rendering of background and border is covered in the
    # label test. The title added to plot as the primary title
    #  should always be outside axes and other side renderers.

    plot = Plot(
        x_range=Range1d(0, 10), y_range=Range1d(0, 10), toolbar_location=None,
        title="title_align=left, title_location=left (I should be outside all axes)", title_location='left'
    )
    title_above = Title(text="title_align=left, title_location=above")
    title_right = Title(text="title_align=center, title_location=right (THIS IS BROKEN!!)", title_align='center')
    title_below = Title(text="title_align=right, title_location=below", title_align='right')

    plot.add_layout(title_above, 'above')
    plot.add_layout(title_right, 'right')
    plot.add_layout(title_below, 'below')

    plot.add_layout(LinearAxis(), 'left')
    plot.add_layout(LinearAxis(), 'left')

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)

    # Take screenshot
    assert screenshot.is_valid()
