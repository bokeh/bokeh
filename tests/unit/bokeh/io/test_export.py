#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import re
from typing import Tuple

# Bokeh imports
from bokeh.core.validation import silenced
from bokeh.core.validation.warnings import MISSING_RENDERERS
from bokeh.io.webdriver import webdriver_control
from bokeh.layouts import row
from bokeh.models import ColumnDataSource, Plot, Range1d, Rect
from bokeh.plotting import figure
from bokeh.resources import Resources

# Module under test
import bokeh.io.export as bie # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@pytest.fixture(scope="module", params=["chromium", "firefox"])
def webdriver(request):
    driver = webdriver_control.create(request.param)
    try:
        yield driver
    finally:
        webdriver_control.terminate(driver)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@pytest.mark.selenium
@pytest.mark.parametrize("dimensions", [(14, 14), (44, 44), (144, 144), (444, 444), (1444, 1444)])
def test_get_screenshot_as_png(webdriver, dimensions: Tuple[int, int]) -> None:
    width, height = dimensions
    border = 5

    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=width, plot_width=height,
                  min_border=border,
                  hidpi=False,
                  toolbar_location=None,
                  outline_line_color=None, background_fill_color="#00ff00", border_fill_color="#00ff00")

    with silenced(MISSING_RENDERERS):
        png = bie.get_screenshot_as_png(layout, driver=webdriver)

    # a WxHpx image of white pixels
    assert png.size == (width, height)

    data = png.tobytes()
    assert len(data) == 4*width*height
    assert data == b"\x00\xff\x00\xff"*width*height


@pytest.mark.selenium
@pytest.mark.parametrize("dimensions", [(14, 14), (44, 44), (144, 144), (444, 444), (1444, 1444)])
def test_get_screenshot_as_png_with_glyph(webdriver, dimensions: Tuple[int, int]) -> None:
    width, height = dimensions
    border = 5

    layout = Plot(x_range=Range1d(-1, 1), y_range=Range1d(-1, 1),
                  plot_height=width, plot_width=height,
                  toolbar_location=None,
                  min_border=border,
                  hidpi=False,
                  outline_line_color=None, background_fill_color="#00ff00", border_fill_color="#00ff00")
    glyph = Rect(x="x", y="y", width=2, height=2, fill_color="#ff0000", line_color="#ff0000")
    source = ColumnDataSource(data=dict(x=[0], y=[0]))
    layout.add_glyph(source, glyph)

    png = bie.get_screenshot_as_png(layout, driver=webdriver)
    assert png.size == (width, height)

    data = png.tobytes()
    assert len(data) == 4*width*height

    # count red pixels in center area
    count = 0
    for x in range(width*height):
        pixel = data[x*4:x*4+4]
        if pixel == b"\xff\x00\x00\xff":
            count += 1

    w, h, b = width, height, border
    expected_count = w*h - 2*b*(w + h) + 4*b**2
    assert count == expected_count

@pytest.mark.selenium
def test_get_screenshot_as_png_with_unicode_minified(webdriver) -> None:
    p = figure(title="유니 코드 지원을위한 작은 테스트")

    with silenced(MISSING_RENDERERS):
        png = bie.get_screenshot_as_png(p, driver=webdriver, resources=Resources(mode="inline", minified=True))

    assert len(png.tobytes()) > 0

@pytest.mark.selenium
def test_get_screenshot_as_png_with_unicode_unminified(webdriver) -> None:
    p = figure(title="유니 코드 지원을위한 작은 테스트")

    with silenced(MISSING_RENDERERS):
        png = bie.get_screenshot_as_png(p, driver=webdriver, resources=Resources(mode="inline", minified=False))

    assert len(png.tobytes()) > 0

@pytest.mark.selenium
def test_get_svgs_no_svg_present() -> None:
    layout = Plot(x_range=Range1d(), y_range=Range1d(),
              plot_height=20, plot_width=20, toolbar_location=None)

    with silenced(MISSING_RENDERERS):
        svgs = bie.get_svgs(layout)

    assert svgs == []

@pytest.mark.selenium
def test_get_svgs_with_svg_present(webdriver) -> None:

    def fix_ids(svg):
        svg = re.sub(r'id="\w{12}"', 'id="X"', svg)
        svg = re.sub(r'url\(#\w{12}\)', 'url(#X)', svg)
        return svg

    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=20, plot_width=20, toolbar_location=None,
                  outline_line_color=None, border_fill_color=None,
                  background_fill_color="red", output_backend="svg")

    with silenced(MISSING_RENDERERS):
        svg0 = fix_ids(bie.get_svgs(layout, driver=webdriver)[0])
        svg1 = fix_ids(bie.get_svgs(layout, driver=webdriver)[0])

    svg2 = (
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20">'
        '<defs/>'
        '<g transform="scale(1,1) translate(0.5,0.5)">'
            '<rect fill="rgb(255,0,0)" stroke="none" x="5" y="5" width="10" height="10" fill-opacity="1"/>'
            '<g/>'
        '</g>'
        '</svg>'
    )

    assert svg0 == svg2
    assert svg1 == svg2

def test_get_layout_html_resets_plot_dims() -> None:
    initial_height, initial_width = 200, 250

    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  plot_height=initial_height, plot_width=initial_width)

    with silenced(MISSING_RENDERERS):
        bie.get_layout_html(layout, height=100, width=100)

    assert layout.plot_height == initial_height
    assert layout.plot_width == initial_width

def test_layout_html_on_child_first() -> None:
    p = Plot(x_range=Range1d(), y_range=Range1d())

    with silenced(MISSING_RENDERERS):
        bie.get_layout_html(p, height=100, width=100)

    with silenced(MISSING_RENDERERS):
        layout = row(p)
        bie.get_layout_html(layout)

def test_layout_html_on_parent_first() -> None:
    p = Plot(x_range=Range1d(), y_range=Range1d())

    with silenced(MISSING_RENDERERS):
        layout = row(p)
        bie.get_layout_html(layout)

    with silenced(MISSING_RENDERERS):
        bie.get_layout_html(p, height=100, width=100)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
