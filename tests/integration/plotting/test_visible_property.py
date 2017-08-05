from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration

@pytest.mark.screenshot
def test_visible_property_hides_things_correctly(output_file_url, selenium, screenshot):
    plot = figure(toolbar_location=None)

    l1 = plot.line([1, 2, 3], [1, 2, 3])
    l2 = plot.line([1, 2, 3], [2, 4, 6]) # NOQA

    plot.xaxis.visible = False
    plot.ygrid.visible = False
    l1.visible = False

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)
    screenshot.assert_is_valid()
