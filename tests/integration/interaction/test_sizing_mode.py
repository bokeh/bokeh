from __future__ import absolute_import, division

from bokeh.charts import Histogram
from bokeh.io import save
from bokeh.models import Plot, ColumnDataSource, Rect, DataRange1d
from bokeh.sampledata.autompg import autompg as df

from tests.integration.utils import has_no_console_errors, wait_for_canvas_resize

import pytest

pytestmark = pytest.mark.integration


def make_sizing_mode_plot(plot_width, plot_height, sizing_mode='scale_width'):
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
    plot = Plot(
        plot_height=plot_height, plot_width=plot_width,
        x_range=DataRange1d(), y_range=DataRange1d(),
        sizing_mode=sizing_mode
    )
    plot.add_glyph(source, Rect(x='x', y='y', width=0.9, height=0.9))
    return plot


def test_scale_width_resizes_plot_while_maintaining_aspect_ratio(output_file_url, selenium):

    # We want the aspect ratio of the initial plot to be maintained, but we
    # can't measure it perfectly so we test against bounds.
    aspect_ratio = 2
    plot_height = 400
    plot_width = 400 * aspect_ratio
    lower_bound = aspect_ratio * 0.95
    upper_bound = aspect_ratio * 1.05

    # In this test we tell selenium what to set the browser window to be
    # initially and then finally so we can test that the canvas has
    # scaled down by approximately the correct amount.
    initial_window_width = 1200
    final_window_width = 600

    # Make the plot with autoresize
    plot = make_sizing_mode_plot(plot_width, plot_height, sizing_mode='scale_width')
    save(plot)

    # Open the browser with the plot and resize the window to get an initial measure
    selenium.set_window_size(width=initial_window_width, height=600)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)
    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    initial_height = canvas.size['height']
    initial_width = canvas.size['width']
    initial_aspect_ratio = initial_width / initial_height
    assert initial_aspect_ratio > lower_bound
    assert initial_aspect_ratio < upper_bound

    # Now resize to a smaller window size and check again
    selenium.set_window_size(width=final_window_width, height=600)
    selenium.set_window_size(width=final_window_width, height=599)  # See note (1) below
    wait_for_canvas_resize(canvas, selenium)

    final_height = canvas.size['height']
    final_width = canvas.size['width']
    final_aspect_ratio = final_width / final_height
    assert final_aspect_ratio > lower_bound
    assert final_aspect_ratio < upper_bound

    # Notes:
    # (1) Since the new layout work, this extra kick was necessary for the test
    # to run properly. From what I can tell this is a selenium thing not a
    # real problem, but something to keep an eye on - bird 2016-05-22

def test_scale_width_maintains_a_minimum_width(output_file_url, selenium):
    # The aspect ratio is portrait but should not allow a width less than 100
    plot = make_sizing_mode_plot(600, 1200, sizing_mode='scale_width')
    save(plot)

    # Open the browser with the plot and resize the window small
    selenium.set_window_size(width=100, height=600)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)
    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    # Plot should have been shrunk somewhat
    assert canvas.size['width'] < 600
    assert canvas.size['width'] >= 100


def test_scale_width_maintains_a_minimum_height(output_file_url, selenium):
    # The aspect ratio is landscape but should not allow a height less than 100
    plot = make_sizing_mode_plot(1200, 600, sizing_mode='scale_width')
    save(plot)

    # Open the browser with the plot and resize the window small
    selenium.set_window_size(width=100, height=600)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)
    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    # Plot should have been shrunk somewhat
    assert canvas.size['height'] < 600
    assert canvas.size['height'] >= 100


def test_scale_width_chart_starts_at_correct_size(output_file_url, selenium):
    hist = Histogram(df['mpg'], title="MPG Distribution", sizing_mode='scale_width')
    save(hist)

    selenium.set_window_size(width=1000, height=600)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    # Canvas width should be just under 1000 * 0.9
    # (default file_html has a body width of 90%)
    assert canvas.size['width'] > 850
    assert canvas.size['width'] < 900


def test_scale_width_plot_starts_at_correct_size(output_file_url, selenium):
    plot = make_sizing_mode_plot(600, 600, sizing_mode='scale_width')
    save(plot)

    selenium.set_window_size(width=1000, height=600)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    # Canvas width should be just under 1000 * 0.9
    # (default file_html has a body width of 90%)
    assert canvas.size['width'] > 850
    assert canvas.size['width'] < 900


def test_stretch_both_plot_is_not_taller_than_page(output_file_url, selenium):
    # We can test this by ensuring the aspect ratio changes after initially
    # setting it to square, and that one dimension is close to the window.

    plot = make_sizing_mode_plot(200, 200, sizing_mode='stretch_both')
    save(plot)

    window_width = 1000
    window_height = 300

    selenium.set_window_size(width=window_width, height=window_height)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    canvas_width = canvas.size['width']
    canvas_height = canvas.size['height']
    # Canvas width & height should match window
    # If it was width mode, the plot would remain square (as per the initial aspect ratio)
    assert canvas_width <= window_width
    assert canvas_height <= window_height


def test_scale_both_resizes_width_and_height_with_fixed_aspect_ratio(output_file_url, selenium):
    # Test that a Bokeh plot embedded in a desktop-ish setting (e.g.
    # a Phosphor widget) behaves well w.r.t. resizing.

    # We want the aspect ratio of the initial plot to be maintained, but we
    # can't measure it perfectly so we test against bounds.
    aspect_ratio = 2
    plot_width = 400 * aspect_ratio
    plot_height = 400
    lower_bound = aspect_ratio * 0.95
    upper_bound = aspect_ratio * 1.05

    plot = make_sizing_mode_plot(plot_width, plot_height, sizing_mode='scale_both')
    save(plot)

    # Open the browser with the plot and resize the window to get an initial measure
    selenium.set_window_size(width=1200, height=600)

    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)
    canvas = selenium.find_element_by_tag_name('canvas')

    # Check initial size
    wait_for_canvas_resize(canvas, selenium)
    #
    height1 = canvas.size['height']
    width1 = canvas.size['width']
    aspect_ratio1 = width1 / height1
    assert aspect_ratio1 > lower_bound
    assert aspect_ratio1 < upper_bound

    # Now resize to a smaller width and check again
    selenium.set_window_size(width=800, height=600)
    wait_for_canvas_resize(canvas, selenium)
    #
    height2 = canvas.size['height']
    width2 = canvas.size['width']
    aspect_ratio2 = width2 / height2
    assert aspect_ratio2 > lower_bound
    assert aspect_ratio2 < upper_bound
    assert width2 < width1 - 20
    assert height2 < height1 - 20

    # Now resize back and check again
    selenium.set_window_size(width=1200, height=600)
    wait_for_canvas_resize(canvas, selenium)
    #
    height3 = canvas.size['height']
    width3 = canvas.size['width']
    assert width3 == width1
    assert height3 == height1

    # Now resize to a smaller height and check again
    selenium.set_window_size(width=1200, height=400)
    wait_for_canvas_resize(canvas, selenium)
    #
    height4 = canvas.size['height']
    width4 = canvas.size['width']
    aspect_ratio4 = width4 / height4
    assert aspect_ratio4 > lower_bound
    assert aspect_ratio4 < upper_bound
    assert width4 < width1
    assert height4 < height1

    # Now resize back and check again
    selenium.set_window_size(width=1200, height=600)
    wait_for_canvas_resize(canvas, selenium)
    #
    height5 = canvas.size['height']
    width5 = canvas.size['width']
    assert width5 == width1
    assert height5 == height1
