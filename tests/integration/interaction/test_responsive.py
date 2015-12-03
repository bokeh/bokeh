from __future__ import absolute_import

from bokeh.charts import Area, Histogram
from bokeh.io import save
from bokeh.plotting import figure
from bokeh.sampledata.autompg import autompg as df

from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException

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
    plot = figure(plot_width=plot_width, plot_height=plot_height, responsive=True)
    plot.scatter([1, 2, 3], [3, 2, 3])
    save(plot)

    # Open the browser with the plot and resize the window to get an initial measure
    selenium.set_window_size(width=initial_window_width, height=600)

    selenium.get(output_file_url)
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
    plot = figure(plot_width=600, plot_height=1200, responsive=True)
    plot.scatter([1, 2, 3], [3, 2, 3])
    save(plot)

    # Open the browser with the plot and resize the window small
    selenium.set_window_size(width=100, height=600)
    selenium.get(output_file_url)
    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    # Plot should have been shrunk somewhat
    assert canvas.size['width'] < 600
    assert canvas.size['width'] >= 100


def test_responsive_maintains_a_minimum_height(output_file_url, selenium):
    # The aspect ratio is landscape but should not allow a height less than 100
    plot = figure(plot_width=1200, plot_height=600, responsive=True)
    plot.scatter([1, 2, 3], [3, 2, 3])
    save(plot)

    # Open the browser with the plot and resize the window small
    selenium.set_window_size(width=100, height=600)
    selenium.get(output_file_url)
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

    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    # Canvas width should be just under 1000
    assert canvas.size['width'] > 900
    assert canvas.size['width'] < 1000


def test_responsive_legacy_chart_starts_at_correct_size(output_file_url, selenium):
    values = dict(
        apples=[2, 3, 7, 5, 26, 221, 44, 233, 254, 25, 2, 67, 10, 11],
        oranges=[22, 43, 10, 25, 26, 101, 114, 203, 194, 215, 201, 227, 139, 160],
    )

    area = Area(values, title="Area Chart", responsive=True)
    save(area)

    selenium.set_window_size(width=1000, height=600)
    selenium.get(output_file_url)

    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    # Canvas width should be just under 1000
    assert canvas.size['width'] > 900
    assert canvas.size['width'] < 1000


def test_responsive_plot_starts_at_correct_size(output_file_url, selenium):
    plot = figure(responsive=True, title="Test Me")
    plot.scatter([1, 2, 3], [3, 2, 3])
    save(plot)

    selenium.set_window_size(width=1000, height=600)
    selenium.get(output_file_url)

    canvas = selenium.find_element_by_tag_name('canvas')
    wait_for_canvas_resize(canvas, selenium)

    # Canvas width should be just under 1000
    assert canvas.size['width'] > 900
    assert canvas.size['width'] < 1000
