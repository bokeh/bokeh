from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure

import pytest
pytestmark = pytest.mark.integration


def test_autoresize_tool_resizes_plot_while_maintaining_aspect_ratio(output_file_url, selenium):

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
    PLOT_OPTIONS = dict(plot_width=plot_width, plot_height=plot_height, responsive=True)
    plot = figure(**PLOT_OPTIONS).scatter([1, 2, 3], [3, 2, 3])
    save(plot)

    # Open the browser with the plot and resize the window to get an initial measure
    selenium.get(output_file_url)
    selenium.set_window_size(width=initial_window_width, height=600)

    canvas = selenium.find_element_by_tag_name('canvas')
    initial_height = canvas.size['height']
    initial_width = canvas.size['width']
    initial_aspect_ratio = initial_width / initial_height
    assert initial_aspect_ratio > lower_bound
    assert initial_aspect_ratio < upper_bound

    # Now resize to a smaller window size and check again
    selenium.set_window_size(width=final_window_width, height=600)
    canvas = selenium.find_element_by_tag_name('canvas')
    final_height = canvas.size['height']
    final_width = canvas.size['width']
    final_aspect_ratio = final_width / final_height
    assert final_aspect_ratio > lower_bound
    assert final_aspect_ratio < upper_bound
    assert final_width <= initial_width / window_ratio
    assert final_height <= initial_height / window_ratio


def test_autoresize_tool_maintains_a_minimum_width(output_file_url, selenium):
    # The aspect ratio is portrait but should not allow a width less than 100
    PLOT_OPTIONS = dict(plot_width=200, plot_height=400, responsive=True)
    plot = figure(**PLOT_OPTIONS).scatter([1, 2, 3], [3, 2, 3])
    save(plot)

    # Open the browser with the plot and resize the window small
    selenium.get(output_file_url)
    selenium.set_window_size(width=100, height=600)

    canvas = selenium.find_element_by_tag_name('canvas')
    assert canvas.size['width'] >= 100


def test_autoresize_tool_maintains_a_minimum_height(output_file_url, selenium):
    # The aspect ratio is landscape but should not allow a height less than 100
    PLOT_OPTIONS = dict(plot_width=200, plot_height=100, responsive=True)
    plot = figure(**PLOT_OPTIONS).scatter([1, 2, 3], [3, 2, 3])
    save(plot)

    # Open the browser with the plot and resize the window small
    selenium.get(output_file_url)
    selenium.set_window_size(width=100, height=600)

    canvas = selenium.find_element_by_tag_name('canvas')
    assert canvas.size['height'] >= 100
