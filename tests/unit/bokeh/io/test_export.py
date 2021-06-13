#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from typing import TYPE_CHECKING, Tuple

# External imports
from flaky import flaky

if TYPE_CHECKING:
    from selenium.webdriver.remote.webdriver import WebDriver

# Bokeh imports
from bokeh.core.validation import silenced
from bokeh.core.validation.warnings import MISSING_RENDERERS
from bokeh.io.webdriver import webdriver_control
from bokeh.layouts import row
from bokeh.models import (
    ColumnDataSource,
    Plot,
    Range1d,
    Rect,
)
from bokeh.plotting import figure
from bokeh.resources import Resources

# Module under test
import bokeh.io.export as bie # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@pytest.fixture(scope="module", params=["chromium", "firefox"])
def webdriver(request: pytest.FixtureRequest):
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

@flaky(max_runs=10)
@pytest.mark.selenium
@pytest.mark.parametrize("dimensions", [(14, 14), (44, 44), (144, 144), (444, 444), (1444, 1444)])
def test_get_screenshot_as_png(webdriver: WebDriver, dimensions: Tuple[int, int]) -> None:
    width, height = dimensions
    border = 5

    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  height=width, width=height,
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


@flaky(max_runs=10)
@pytest.mark.selenium
@pytest.mark.parametrize("dimensions", [(14, 14), (44, 44), (144, 144), (444, 444), (1444, 1444)])
def test_get_screenshot_as_png_with_glyph(webdriver: WebDriver, dimensions: Tuple[int, int]) -> None:
    width, height = dimensions
    border = 5

    layout = Plot(x_range=Range1d(-1, 1), y_range=Range1d(-1, 1),
                  height=width, width=height,
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

@flaky(max_runs=10)
@pytest.mark.selenium
def test_get_screenshot_as_png_with_unicode_minified(webdriver: WebDriver) -> None:
    p = figure(title="유니 코드 지원을위한 작은 테스트")

    with silenced(MISSING_RENDERERS):
        png = bie.get_screenshot_as_png(p, driver=webdriver, resources=Resources(mode="inline", minified=True))

    assert len(png.tobytes()) > 0

@flaky(max_runs=10)
@pytest.mark.selenium
def test_get_screenshot_as_png_with_unicode_unminified(webdriver: WebDriver) -> None:
    p = figure(title="유니 코드 지원을위한 작은 테스트")

    with silenced(MISSING_RENDERERS):
        png = bie.get_screenshot_as_png(p, driver=webdriver, resources=Resources(mode="inline", minified=False))

    assert len(png.tobytes()) > 0

@flaky(max_runs=10)
@pytest.mark.selenium
def test_get_svg_no_svg_present() -> None:
    layout = Plot(x_range=Range1d(), y_range=Range1d(), height=20, width=20, toolbar_location=None)

    with silenced(MISSING_RENDERERS):
        svgs = bie.get_svg(layout)

    assert svgs == [
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20">'
            '<defs/>'
            '<image width="20" height="20" preserveAspectRatio="none" xlink:href="'
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAbElEQVQ4T2P8//+/AwMDAwhTBTD+//+/gYGBoZ4'
            'qpjEwMIwaCAnJN2/eMPz69YtgsLKxsTGIiIigqMMahs+ePWOQkpIiaCA2daMGQoJtNAxxJp+BSzbE5hRmZuYL4uLiBsheGC1tCJYHBBUAAA7h'
            'kkaBfwzpAAAAAElFTkSuQmCC"/>'
        '</svg>',
    ]

@flaky(max_runs=10)
@pytest.mark.selenium
def test_get_svg_with_svg_present(webdriver: WebDriver) -> None:
    plot = lambda color: Plot(
        x_range=Range1d(), y_range=Range1d(),
        height=20, width=20, toolbar_location=None,
        outline_line_color=None, border_fill_color=None,
        background_fill_color=color, output_backend="svg",
    )

    layout = row([plot("red"), plot("blue")])

    with silenced(MISSING_RENDERERS):
        svgs0 = bie.get_svg(layout, driver=webdriver)
        svgs1 = bie.get_svg(layout, driver=webdriver)

    svgs2 = [
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="40" height="20">'
            '<defs/>'
            '<path fill="rgb(255,0,0)" stroke="none" paint-order="stroke" d="M 5.5 5.5 L 15.5 5.5 L 15.5 15.5 L 5.5 15.5 L 5.5 5.5" fill-opacity="1"/>'
            '<g transform="matrix(1, 0, 0, 1, 20, 0)">'
                '<path fill="rgb(0,0,255)" stroke="none" paint-order="stroke" d="M 5.5 5.5 L 15.5 5.5 L 15.5 15.5 L 5.5 15.5 L 5.5 5.5" fill-opacity="1"/>'
            '</g>'
        '</svg>',
    ]

    assert svgs0 == svgs2
    assert svgs1 == svgs2

@flaky(max_runs=10)
@pytest.mark.selenium
def test_get_svgs_no_svg_present() -> None:
    layout = Plot(x_range=Range1d(), y_range=Range1d(), height=20, width=20, toolbar_location=None)

    with silenced(MISSING_RENDERERS):
        svgs = bie.get_svgs(layout)

    assert svgs == []

@flaky(max_runs=10)
@pytest.mark.selenium
def test_get_svgs_with_svg_present(webdriver: WebDriver) -> None:
    plot = lambda color: Plot(
        x_range=Range1d(), y_range=Range1d(),
        height=20, width=20, toolbar_location=None,
        outline_line_color=None, border_fill_color=None,
        background_fill_color=color, output_backend="svg",
    )

    layout = row([plot("red"), plot("blue")])

    with silenced(MISSING_RENDERERS):
        svgs0 = bie.get_svgs(layout, driver=webdriver)
        svgs1 = bie.get_svgs(layout, driver=webdriver)

    svgs2 = [
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20">'
            '<defs/>'
            '<path fill="rgb(255,0,0)" stroke="none" paint-order="stroke" d="M 5.5 5.5 L 15.5 5.5 L 15.5 15.5 L 5.5 15.5 L 5.5 5.5" fill-opacity="1"/>'
        '</svg>',
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" height="20">'
            '<defs/>'
            '<path fill="rgb(0,0,255)" stroke="none" paint-order="stroke" d="M 5.5 5.5 L 15.5 5.5 L 15.5 15.5 L 5.5 15.5 L 5.5 5.5" fill-opacity="1"/>'
        '</svg>',
    ]

    assert svgs0 == svgs2
    assert svgs1 == svgs2

def test_get_layout_html_resets_plot_dims() -> None:
    initial_height, initial_width = 200, 250

    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  height=initial_height, width=initial_width)

    with silenced(MISSING_RENDERERS):
        bie.get_layout_html(layout, height=100, width=100)

    assert layout.height == initial_height
    assert layout.width == initial_width

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
