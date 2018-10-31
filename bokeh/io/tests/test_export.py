# -*- coding: utf-8 -*-
#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from mock import patch
import re

# External imports
from PIL import Image

# Bokeh imports
from bokeh.layouts import row
from bokeh.models.plots import Plot
from bokeh.models.ranges import Range1d
from bokeh.io.webdriver import webdriver_control, terminate_webdriver
from bokeh.plotting import figure
from bokeh.resources import Resources

# Module under test
import bokeh.io.export as bie

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@pytest.fixture(scope='module')
def webdriver():
    driver = webdriver_control.create()
    yield driver
    terminate_webdriver(driver)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@pytest.mark.unit
@pytest.mark.selenium
def test_get_screenshot_as_png():
    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=20, plot_width=20, toolbar_location=None,
                  outline_line_color=None, background_fill_color=None,
                  border_fill_color=None)

    png = bie.get_screenshot_as_png(layout)
    assert png.size == (20, 20)
    # a 20x20px image of transparent pixels
    assert png.tobytes() == ("\x00"*1600).encode()

@pytest.mark.unit
@pytest.mark.selenium
def test_get_screenshot_as_png_with_driver(webdriver):
    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=20, plot_width=20, toolbar_location=None,
                  outline_line_color=None, background_fill_color=None,
                  border_fill_color=None)

    png = bie.get_screenshot_as_png(layout, driver=webdriver)

    assert png.size == (20, 20)
    # a 20x20px image of transparent pixels
    assert png.tobytes() == ("\x00"*1600).encode()

@pytest.mark.unit
@pytest.mark.selenium
def test_get_screenshot_as_png_large_plot(webdriver):
    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=800, plot_width=800, toolbar_location=None,
                  outline_line_color=None, background_fill_color=None,
                  border_fill_color=None)

    bie.get_screenshot_as_png(layout, driver=webdriver)

    # LC: Although the window size doesn't match the plot dimensions (unclear
    # why), the window resize allows for the whole plot to be captured
    assert webdriver.get_window_size() == {'width': 1366, 'height': 768}

@pytest.mark.unit
@pytest.mark.selenium
def test_get_screenshot_as_png_with_unicode_minified(webdriver):
    p = figure(title="유니 코드 지원을위한 작은 테스트")

    png = bie.get_screenshot_as_png(p, driver=webdriver, resources=Resources(mode="inline", minified=True))
    assert len(png.tobytes()) > 0

@pytest.mark.unit
@pytest.mark.selenium
def test_get_screenshot_as_png_with_unicode_unminified(webdriver):
    p = figure(title="유니 코드 지원을위한 작은 테스트")

    png = bie.get_screenshot_as_png(p, driver=webdriver, resources=Resources(mode="inline", minified=False))
    assert len(png.tobytes()) > 0

@pytest.mark.unit
@pytest.mark.selenium
def test_get_svgs_no_svg_present():
    layout = Plot(x_range=Range1d(), y_range=Range1d(),
              plot_height=20, plot_width=20, toolbar_location=None)

    svgs = bie.get_svgs(layout)
    assert svgs == []

@pytest.mark.unit
@pytest.mark.selenium
def test_get_svgs_with_svg_present(webdriver):

    def fix_ids(svg):
        svg = re.sub(r'id="\w{12}"', 'id="X"', svg)
        svg = re.sub(r'url\(#\w{12}\)', 'url(#X)', svg)
        return svg

    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=20, plot_width=20, toolbar_location=None,
                  outline_line_color=None, border_fill_color=None,
                  background_fill_color="red", output_backend="svg")

    svg0 = fix_ids(bie.get_svgs(layout, driver=webdriver)[0])
    svg1 = fix_ids(bie.get_svgs(layout, driver=webdriver)[0])

    svg2 = (
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        'width="20" height="20" style="width: 20px; height: 20px;">'
        '<defs>'
            '<clipPath id="X"><path fill="none" stroke="none" d=" M 5 5 L 15 5 L 15 15 L 5 15 L 5 5 Z"/></clipPath>'
            '<clipPath id="X"><path fill="none" stroke="none" d=" M 5 5 L 15 5 L 15 15 L 5 15 L 5 5 Z"/></clipPath>'
        '</defs>'
        '<g>'
            '<g transform="scale(1,1) translate(0.5,0.5)">'
                '<rect fill="#FFFFFF" stroke="none" x="0" y="0" width="20" height="20"/>'
                '<rect fill="red" stroke="none" x="5" y="5" width="10" height="10"/>'
                '<g/>'
                '<g clip-path="url(#X)"><g/></g>'
                '<g clip-path="url(#X)"><g/></g>'
                '<g/>'
            '</g>'
        '</g>'
        '</svg>'
    )

    assert svg0 == svg2
    assert svg1 == svg2

def test_get_layout_html_resets_plot_dims():
    initial_height, initial_width = 200, 250

    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=initial_height, plot_width=initial_width)

    bie.get_layout_html(layout, height=100, width=100)

    assert layout.plot_height == initial_height
    assert layout.plot_width == initial_width

def test_layout_html_on_child_first():
    p = Plot(x_range=Range1d(), y_range=Range1d())

    bie.get_layout_html(p, height=100, width=100)

    layout = row(p)
    bie.get_layout_html(layout)

def test_layout_html_on_parent_first():
    p = Plot(x_range=Range1d(), y_range=Range1d())

    layout = row(p)
    bie.get_layout_html(layout)

    bie.get_layout_html(p, height=100, width=100)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

@patch('PIL.Image.Image')
def test__crop_image_args(mock_Image):
    image = mock_Image()
    bie._crop_image(image, left='left', right='right', top='top', bottom='bottom', extra=10)
    assert image.crop.call_count == 1
    assert image.crop.call_args[0] == (('left', 'top', 'right', 'bottom'), )
    assert image.crop.call_args[1] == {}

def test__crop_image():
    image = Image.new(mode="RGBA", size=(10,10))
    rect = dict(left=2, right=8, top=3, bottom=7)
    cropped = bie._crop_image(image, **rect)
    assert cropped.size == (6,4)
