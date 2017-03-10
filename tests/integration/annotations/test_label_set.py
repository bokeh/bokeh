from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Plot, Range1d, LabelSet, LinearAxis, ColumnDataSource

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600


@pytest.mark.screenshot
def test_label_set(output_file_url, selenium, screenshot):

    source = ColumnDataSource(data=dict(text=['one', 'two', 'three'],
                                        x1=[1,4,7],
                                        x2=[60,240,420]))

    # Have to specify x/y range as labels aren't included in the plot area solver
    plot = Plot(plot_height=HEIGHT, plot_width=WIDTH,
                x_range=Range1d(0, 10), y_range=Range1d(0, 10),
                toolbar_location=None)

    label_set1 = LabelSet(x='x1', y=2, x_offset=25, y_offset=25,
                          text="text", source=source,
                          text_font_size='38pt', text_color='red', text_alpha=0.9,
                          text_baseline='bottom', text_align='left',
                          background_fill_color='green', background_fill_alpha=0.2,
                          angle=15, angle_units='deg',
                          render_mode='canvas')

    label_set2 = LabelSet(x='x2', y=4, x_units='screen', x_offset=25, y_offset=25,
                          text="text", source=source,
                          text_font_size='38pt', text_color='red', text_alpha=0.9,
                          text_baseline='bottom', text_align='left',
                          background_fill_color='green', background_fill_alpha=0.2,
                          angle=15, angle_units='deg',
                          render_mode='css')

    plot.add_layout(LinearAxis(), 'below')
    plot.add_layout(LinearAxis(), 'left')

    plot.add_layout(label_set1)
    plot.add_layout(label_set2)

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)

    # Take screenshot
    screenshot.assert_is_valid()
