from bokeh.io import save
from bokeh.models import (
    ColumnDataSource,
    HoverTool,
    LinearAxis,
    Patches,
    Plot,
    Range1d,
)
from selenium.webdriver.common.action_chains import ActionChains
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration


def test_patches_hover_still_works_when_a_seleciton_is_preselcted(output_file_url, selenium):
    # This tests an edge case interaction when Patches (specifically) is used
    # with a tool that requires hit testing e.g. HitTool AND a selection is
    # pre-made on the data source driving it.
    plot = Plot(
        x_range=Range1d(0, 100),
        y_range=Range1d(0, 100),
        min_border=0
    )
    source = ColumnDataSource(dict(
        xs=[[0, 50, 50, 0], [50, 100, 100, 50]],
        ys=[[0, 0, 100, 100], [0, 0, 100, 100]],
        color=['pink', 'blue']
    ))
    source.selected = {
        '0d': {'glyph': None, 'indices': []},
        '1d': {'indices': [1]},
        '2d': {'indices': {}},
    }
    plot.add_glyph(source, Patches(xs='xs', ys='ys', fill_color='color'))
    plot.add_tools(HoverTool())
    plot.add_layout(LinearAxis(), 'below')
    plot.add_layout(LinearAxis(), 'left')
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Hover plot and test no error
    canvas = selenium.find_element_by_tag_name('canvas')
    actions = ActionChains(selenium)
    actions.move_to_element_with_offset(canvas, 100, 100)
    actions.perform()

    # If this assertion fails then there were likely errors on hover
    assert has_no_console_errors(selenium)
