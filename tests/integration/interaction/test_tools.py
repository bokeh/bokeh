from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import BoxSelectTool, ColumnDataSource, CustomJS, LassoSelectTool
from bokeh.plotting import figure
from selenium.webdriver.common.action_chains import ActionChains
from tests.integration.utils import has_no_console_errors

import pytest
pytestmark = pytest.mark.integration

PLOT_DIM = 600

def generate_plot():
    source = ColumnDataSource(dict(
        x=[1, 2, 3],
        y=[3, 2, 3],
        name=['top_left', 'middle', 'top_right'],
    ))
    # Make plot and add a taptool callback that generates an alert
    plot = figure(tools='', height=PLOT_DIM, width=PLOT_DIM, x_range=[1, 3], y_range=[1, 3])
    plot.circle(x='x', y='y', radius=0.2, source=source)

    source.callback = CustomJS(code="""
        var indices = cb_obj.selected['1d'].indices,
            data = cb_obj.data,
            selected_names = '';

        indices.forEach(function(index) {
            selected_names += data['name'][index];
        });

        alert(selected_names);
    """)

    return plot

def test_box_select(output_file_url, selenium):
    plot = generate_plot()

    plot.add_tools(BoxSelectTool())

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Drag a box zoom around middle point
    canvas = selenium.find_element_by_tag_name('canvas')

    actions = ActionChains(selenium)
    actions.move_to_element_with_offset(canvas, PLOT_DIM * 0.25, PLOT_DIM * 0.25)
    actions.click_and_hold()
    actions.move_by_offset(PLOT_DIM * 0.5, PLOT_DIM * 0.5)
    actions.release()
    actions.perform()

    # Get the alert from box select and assert that the middle item is selected
    alert = selenium.switch_to_alert()
    assert alert.text == 'middle'

def test_lasso_select(output_file_url, selenium):
    plot = generate_plot()

    #limit to one callback on click release
    plot.add_tools(LassoSelectTool(select_every_mousemove=False))

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Drag a lasso selection area around middle point
    canvas = selenium.find_element_by_tag_name('canvas')

    actions = ActionChains(selenium)
    actions.move_to_element_with_offset(canvas, PLOT_DIM * 0.25, PLOT_DIM * 0.25)
    actions.click_and_hold()
    actions.move_by_offset(0, PLOT_DIM * 0.5)
    actions.move_by_offset(PLOT_DIM * 0.5, 0)
    actions.move_by_offset(0, PLOT_DIM * -0.5)
    actions.release()
    actions.perform()

    # Get the alert from box select and assert that the middle item is selected
    alert = selenium.switch_to_alert()
    assert alert.text == 'middle'
