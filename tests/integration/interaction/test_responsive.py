from __future__ import absolute_import

from bokeh.charts import Histogram
from bokeh.io import save
from bokeh.models import Plot, ColumnDataSource, Rect, DataRange1d
from bokeh.sampledata.autompg import autompg as df

from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from tests.integration.utils import has_no_console_errors

import pytest

from ..utils import element_to_start_resizing, element_to_finish_resizing

pytestmark = pytest.mark.integration


def wait_for_canvas_resize(canvas, test_driver):
    try:
        wait = WebDriverWait(test_driver, 5)
        wait.until(element_to_start_resizing(canvas))
        wait.until(element_to_finish_resizing(canvas))
    except TimeoutException:
        # Resize may or may not happen instantaneously,
        # Put the waits in to give some time, but allow test to
        # try and process.
        pass


def make_responsive_plot(plot_width, plot_height, responsive_mode='width'):
    source = ColumnDataSource(dict(x=[1, 2], y=[1, 1]))
    plot = Plot(
        plot_height=plot_height, plot_width=plot_width,
        x_range=DataRange1d(), y_range=DataRange1d(),
        responsive=responsive_mode
    )
    plot.add_glyph(source, Rect(x='x', y='y', width=0.9, height=0.9))
    return plot


def test_responsive_resizes_plot_while_maintaining_aspect_ratio(output_file_url, selenium):

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
    window_ratio = initial_window_width / final_window_width

    # Make the plot with autoresize
    plot = make_responsive_plot(plot_width, plot_height, responsive_mode='width')
    save(plot)

    # Open the browser with the plot and resize the window to get an initial measure
    selenium.set_window_size(width=initial_window_width, height=600)

    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)
    canvas = selenium.find_element_by_tag_name('canvas')

    initial_height = canvas.size['height']
    initial_width = canvas.size['width']
    initial_aspect_ratio = initial_width / initial_height
    assert initial_aspect_ratio > lower_bound
    assert initial_aspect_ratio < upper_bound

    # Now resize to a smaller window size and check again
    selenium.set_window_size(width=final_window_width, height=600)
    wait_for_canvas_resize(canvas, selenium)
    final_height = canvas.size['height']
    final_width = canvas.size['width']
    final_aspect_ratio = final_width / final_height
    assert final_aspect_ratio > lower_bound
    assert final_aspect_ratio < upper_bound
    assert final_width <= initial_width / window_ratio
    assert final_height <= initial_height / window_ratio


def test_responsive_maintains_a_minimum_width(output_file_url, selenium):
    # The aspect ratio is portrait but should not allow a width less than 100
    plot = make_responsive_plot(600, 1200, responsive_mode='width')
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


def test_responsive_maintains_a_minimum_height(output_file_url, selenium):
    # The aspect ratio is landscape but should not allow a height less than 100
    plot = make_responsive_plot(1200, 600, responsive_mode='width')
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


def test_responsive_chart_starts_at_correct_size(output_file_url, selenium):
    hist = Histogram(df['mpg'], title="MPG Distribution", responsive=True)
    save(hist)

    selenium.set_window_size(width=1000, height=600)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    # Canvas width should be just under 1000
    assert canvas.size['width'] > 900
    assert canvas.size['width'] < 1000


def test_responsive_plot_starts_at_correct_size(output_file_url, selenium):
    plot = make_responsive_plot(600, 600, responsive_mode='width')
    save(plot)

    selenium.set_window_size(width=1000, height=600)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    # Canvas width should be just under 1000
    assert canvas.size['width'] > 900
    assert canvas.size['width'] < 1000


def test_box_responsive_plot_fills_entire_page(output_file_url, selenium):
    # We can test this by ensuring the aspect ratio changes after initially
    # setting it to square, and that one dimension is close to the window.

    plot = make_responsive_plot(200, 200, responsive_mode='box')
    save(plot)

    window_width = 1000
    window_height = 300
    window_aspect = window_width / window_height

    selenium.set_window_size(width=window_width, height=window_height)
    selenium.get(output_file_url)
    assert has_no_console_errors(selenium)

    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    canvas_width = canvas.size['width']
    canvas_height = canvas.size['height']
    canvas_aspect = canvas_width / canvas_height
    # Canvas width should be close to window_width
    assert canvas_width > window_width * 0.9
    assert canvas_width < window_width
    assert canvas_aspect == window_aspect


@pytest.mark.skip(reason='we do not currently have aspect ratio on plot')
def test_box_responsive_resizes_width_and_height_with_fixed_aspect_ratio(output_file_url, selenium):
    # Test that a Bokeh plot embedded in a desktop-ish setting (e.g.
    # a Phosphor widget) behaves well w.r.t. resizing.

    # We want the aspect ratio of the initial plot to be maintained, but we
    # can't measure it perfectly so we test against bounds.
    aspect_ratio = 2
    plot_height = 400
    plot_width = 400 * aspect_ratio
    lower_bound = aspect_ratio * 0.95
    upper_bound = aspect_ratio * 1.05

    plot = make_responsive_plot(plot_width, plot_height, responsive_mode='box')
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
    assert width4 < width1 - 20
    assert height4 < height1 - 20

    # Now resize back and check again
    selenium.set_window_size(width=1200, height=600)
    wait_for_canvas_resize(canvas, selenium)
    #
    height5 = canvas.size['height']
    width5 = canvas.size['width']
    assert width5 == width1
    assert height5 == height1
