from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Plot, Range1d, Band, ColumnDataSource
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration

HEIGHT = 600
WIDTH = 600

@pytest.mark.screenshot
def test_band(output_file_url, selenium, screenshot):

    x_range = Range1d(0, 10)
    y_range = Range1d(0, 10)

    # Have to specify x/y range as labels aren't included in the plot area solver
    plot = Plot(plot_height=HEIGHT, plot_width=WIDTH,
                x_range=x_range, y_range=y_range, toolbar_location=None)

    source = ColumnDataSource(data=dict(
        x1 = [1,3,5,7,9],
        lower1 = [1,2,1,2,1],
        upper1 = [2,3,2,3,2],
        x2 = [200, 250, 350, 450, 550],
        lower2 = [400, 300, 400, 300, 400],
        upper2 = [500, 400, 500, 400, 500],
    ))

    band1 = Band(base='x1', lower='lower1', upper='upper1',
                 line_width=3, line_color='red', line_dash='dashed',
                 source=source)
    band2 = Band(base='x2', lower='lower2', upper='upper2',
                 base_units='screen', lower_units='screen', upper_units='screen',
                 dimension='width', line_width=3, fill_color='blue', line_color='green',
                 source=source)

    plot.add_layout(band1)
    plot.add_layout(band2)

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Take screenshot
    screenshot.assert_is_valid()
