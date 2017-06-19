from __future__ import absolute_import, print_function

import pytest
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys

from bokeh.io import save
from bokeh.plotting import figure
from bokeh.models import ColumnDataSource, Plot, Circle, Line, Range1d, BoxSelectTool
from tests.integration.utils import has_no_console_errors, wait_for_canvas_resize

pytestmark = pytest.mark.integration


def make_plot(tools='box_select'):
    plot = figure(id='plot-id', height=800, width=800, x_range=(0,6),
                  y_range=(0,6), tools=tools)
    plot.rect(name='rect-glyph', x=[1, 3, 5], y=[3, 3, 3], width=1, height=1)
    return plot

def perform_box_selection(selenium, start, end, hold_shift=False):
    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    actions = ActionChains(selenium)
    if hold_shift:
        actions.key_down(Keys.LEFT_SHIFT)
    actions.move_to_element_with_offset(canvas, *start)
    actions.click_and_hold()
    actions.move_by_offset(*end)
    actions.release()
    if hold_shift:
        actions.key_up(Keys.LEFT_SHIFT)
    actions.perform()

def test_selection_tool_make_selection(output_file_url, selenium):
    plot = make_plot()

    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    perform_box_selection(selenium, (50, 200), (450, 400))

    code = "return Bokeh.index['plot-id'].model.select_one('rect-glyph').data_source.selected['1d'].indices"
    selected = selenium.execute_script(code)
    assert selected == [0, 1]

def test_selection_tool_selection_ending_outside_frame_makes_selection(output_file_url, selenium):
    plot = make_plot()

    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # make selection ending outside of frame
    perform_box_selection(selenium, (50, 50), (1000, 1000))

    code = "return Bokeh.index['plot-id'].model.select_one('rect-glyph').data_source.selected['1d'].indices"
    selected = selenium.execute_script(code)
    assert selected == [0,1,2]

def test_selection_tool_non_selection_clears_selected(output_file_url, selenium):
    plot = make_plot()

    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # make first selection
    perform_box_selection(selenium, (50, 200), (200, 400))
    # make selection over no glyphs
    perform_box_selection(selenium, (50, 50), (50, 50))

    code = "return Bokeh.index['plot-id'].model.select_one('rect-glyph').data_source.selected['1d'].indices"
    selected = selenium.execute_script(code)
    assert selected == []

def test_selection_tool_new_selection_clears_old_selection(output_file_url, selenium):
    plot = make_plot()

    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # make first selection
    perform_box_selection(selenium, (50, 200), (250, 400))
    # make second selection
    perform_box_selection(selenium, (250, 200), (300, 400))

    code = "return Bokeh.index['plot-id'].model.select_one('rect-glyph').data_source.selected['1d'].indices"
    selected = selenium.execute_script(code)
    assert selected == [1]

def test_selection_tool_multiselection_with_shift(output_file_url, selenium):
    plot = make_plot()

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # make first selection
    perform_box_selection(selenium, (50, 200), (250, 400))
    # make second, multi-selection with shift
    perform_box_selection(selenium, (475, 200), (275, 400), hold_shift=True)

    code = "return Bokeh.index['plot-id'].model.select_one('rect-glyph').data_source.selected['1d'].indices"
    selected = selenium.execute_script(code)
    assert selected == [0, 2]

@pytest.mark.screenshot
def test_line_rendering_with_selected_points(output_file_url, selenium, screenshot):
    plot = Plot(plot_height=400, plot_width=400,
        x_range=Range1d(0, 4), y_range=Range1d(-1, 1))

    x = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]
    y = [ 0.        ,  0.84147098,  0.90929743,  0.14112001, -0.7568025 ,
       -0.95892427, -0.2794155 ,  0.6569866 ,  0.98935825] # sin(2*x)

    source = ColumnDataSource(data=dict(x=x,y=y))
    plot.add_glyph(source, Circle(x='x', y='y'))
    plot.add_glyph(source, Line(x='x', y='y'))

    plot.add_tools(BoxSelectTool())

    # Save the plot and start the test
    save(plot)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    # Perform selection and take screenshot
    perform_box_selection(selenium, (0, 100), (400, 250))
    screenshot.assert_is_valid()
