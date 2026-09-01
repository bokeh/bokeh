#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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
import asyncio
import re
import sys
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import TYPE_CHECKING, Literal

# External imports
import PIL.Image

## External imports
if TYPE_CHECKING:
    from playwright.sync_api import Browser
    from selenium.webdriver.remote.webdriver import WebDriver

# Bokeh imports
from bokeh.core.validation import silenced
from bokeh.core.validation.warnings import MISSING_RENDERERS
from bokeh.io.state import curstate
from bokeh.layouts import row
from bokeh.models import (
    Circle,
    ColumnDataSource,
    DataRange1d,
    Div,
    Legend,
    LegendItem,
    Plot,
    Range1d,
    Rect,
)
from bokeh.plotting import figure
from bokeh.resources import Resources
from bokeh.themes import Theme
from bokeh.util.dependencies import is_installed

# Module under test
import bokeh.io.browser as bib # isort:skip
import bokeh.io.export as bie # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

_has_selenium = is_installed("selenium")
_has_playwright = is_installed("playwright")

_webdriver_params = [
    pytest.param("chromium", marks=pytest.mark.xdist_group(name="export-chromium")),
    pytest.param("firefox", marks=pytest.mark.xdist_group(name="export-firefox")),
]

if not _has_selenium and not _has_playwright:
    pytest.skip("Neither Selenium nor Playwright is installed", allow_module_level=True)


@pytest.fixture(scope="module")
def browser():
    if not _has_playwright:
        pytest.skip("Playwright not installed")
    from playwright.sync_api import sync_playwright
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(args=["--hide-scrollbars", "--force-color-profile=srgb"])
        try:
            yield browser
        finally:
            browser.close()


@pytest.fixture(scope="module", params=_webdriver_params)
def webdriver(request: pytest.FixtureRequest):
    if not _has_selenium:
        pytest.skip("Selenium not installed")
    from bokeh.io.webdriver import webdriver_control
    driver = webdriver_control.create(request.param)
    try:
        yield driver
    finally:
        webdriver_control.terminate(driver)


@pytest.fixture(scope="module", params=_webdriver_params)
def webdriver_with_scale_factor(request: pytest.FixtureRequest):
    if not _has_selenium:
        pytest.skip("Selenium not installed")
    from bokeh.io.webdriver import webdriver_control
    driver = webdriver_control.create(request.param, scale_factor=2.5)
    try:
        yield driver
    finally:
        webdriver_control.terminate(driver)


@pytest.fixture(scope="module", autouse=True)
def disable_max_image_pixels():
    max_image_pixels = PIL.Image.MAX_IMAGE_PIXELS
    PIL.Image.MAX_IMAGE_PIXELS = None
    yield
    PIL.Image.MAX_IMAGE_PIXELS = max_image_pixels


#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def _assert_solid_region(image: PIL.Image.Image, box: tuple[int, int, int, int], pixel: bytes) -> None:
    region = image.crop(box)
    assert region.tobytes() == pixel*region.width*region.height


# -- Selenium-backend tests ---------------------------------------------------

@pytest.mark.selenium
@pytest.mark.parametrize("dimensions", [(14, 14), (44, 44), (144, 144), (444, 444), (1444, 1444)])
def test_get_screenshot_as_png(webdriver: WebDriver, dimensions: tuple[int, int]) -> None:
    if sys.platform == "darwin" and webdriver.name == "firefox":
        pytest.skip(reason="unreliable on MacOS and Firefox")

    width, height = dimensions
    border = 5

    layout = Plot(x_range=Range1d(), y_range=Range1d(),
                  height=width, width=height,
                  min_border=border,
                  toolbar_location=None,
                  outline_line_color=None, background_fill_color="#00ff00", border_fill_color="#00ff00")

    with silenced(MISSING_RENDERERS):
        png = bie.get_screenshot_as_png(layout, driver=webdriver)

    assert png.size == (width, height)

    data = png.tobytes()
    assert len(data) == 4*width*height
    # The HiDPI half-pixel transform antialiases the canvas and frame edges.
    green_pixel = b"\x00\xff\x00\xff"
    _assert_solid_region(png, (border + 1, border + 1, width - border, height - border), green_pixel)
    assert png.getpixel((border//2, border//2)) == tuple(green_pixel)


@pytest.mark.selenium
@pytest.mark.parametrize("dimensions", [(14, 14), (44, 44), (144, 144), (444, 444), (1444, 1444)])
def test_get_screenshot_as_png_with_glyph(webdriver: WebDriver, dimensions: tuple[int, int]) -> None:
    if sys.platform == "darwin" and webdriver.name == "firefox":
        pytest.skip(reason="unreliable on MacOS and Firefox")

    width, height = dimensions
    border = 5

    layout = Plot(x_range=Range1d(-1, 1), y_range=Range1d(-1, 1),
                  height=width, width=height,
                  toolbar_location=None,
                  min_border=border,
                  outline_line_color=None, background_fill_color="#00ff00", border_fill_color="#00ff00")
    glyph = Rect(x="x", y="y", width=2, height=2, fill_color="#ff0000", line_color="#ff0000")
    source = ColumnDataSource(data=dict(x=[0], y=[0]))
    layout.add_glyph(source, glyph)

    png = bie.get_screenshot_as_png(layout, driver=webdriver)
    assert png.size == (width, height)

    # The layout is a green border surrounding a red center rectangle. The
    # HiDPI half-pixel transform antialiases their boundaries, so verify the
    # solid interior and a border pixel instead of counting edge pixels.
    red_pixel = b"\xff\x00\x00\xff"
    green_pixel = b"\x00\xff\x00\xff"
    _assert_solid_region(png, (border + 1, border + 1, width - border, height - border), red_pixel)
    assert png.getpixel((border//2, border//2)) == tuple(green_pixel)

@pytest.mark.selenium
def test_get_screenshot_as_png_with_fractional_sizing__issue_12611(webdriver: WebDriver) -> None:
    div = Div(text="Something", styles=dict(width="100.64px", height="50.34px"))
    png = bie.get_screenshot_as_png(div, driver=webdriver)
    assert len(png.tobytes()) > 0

@pytest.mark.selenium
def test_get_screenshot_as_png_with_scale_factor_equal_to_dpr__issue_8807(
        webdriver_with_scale_factor: WebDriver) -> None:
    div = Div(text="Something", styles=dict(width="100px", height="100px"))
    png = bie.get_screenshot_as_png(div, driver=webdriver_with_scale_factor, scale_factor=2.5)
    assert png.width == 250

@pytest.mark.selenium
def test_get_screenshot_as_png_with_scale_factor_less_than_dpr__issue_8807(
        webdriver_with_scale_factor: WebDriver) -> None:
    div = Div(text="Something", styles=dict(width="100px", height="100px"))
    png = bie.get_screenshot_as_png(div, driver=webdriver_with_scale_factor, scale_factor=1.5)
    assert png.width == 150

@pytest.mark.selenium
def test_get_screenshot_as_png_with_scale_factor_greater_than_dpr__issue_8807(
        webdriver_with_scale_factor: WebDriver) -> None:
    div = Div(text="Something", styles=dict(width="100px", height="100px"))
    with pytest.raises(ValueError):
        _ = bie.get_screenshot_as_png(div, driver=webdriver_with_scale_factor, scale_factor=3.5)

@pytest.mark.selenium
def test_get_screenshot_as_png_with_unicode_minified(webdriver: WebDriver) -> None:
    p = figure(title="유니 코드 지원을위한 작은 테스트")

    with silenced(MISSING_RENDERERS):
        png = bie.get_screenshot_as_png(p, driver=webdriver, resources=Resources(mode="inline", minified=True))

    assert len(png.tobytes()) > 0

@pytest.mark.selenium
def test_get_screenshot_as_png_with_unicode_unminified(webdriver: WebDriver) -> None:
    p = figure(title="유니 코드 지원을위한 작은 테스트")

    with silenced(MISSING_RENDERERS):
        png = bie.get_screenshot_as_png(p, driver=webdriver, resources=Resources(mode="inline", minified=False))

    assert len(png.tobytes()) > 0

@pytest.mark.selenium
def test_get_svg_no_svg_present(webdriver: WebDriver) -> None:
    layout = Plot(
        x_range=Range1d(), y_range=Range1d(),
        toolbar_location=None,
        height=20, width=20,
        min_border=0,
        outline_line_color=None,
        border_fill_color=None,
        background_fill_color="red",
        output_backend="canvas",
    )

    with silenced(MISSING_RENDERERS):
        svgs = bie.get_svg(layout, driver=webdriver)

    assert isinstance(svgs, list) and len(svgs) == 1
    [svg] = svgs

    assert svg == (
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20">'
            '<defs/>'
            '<path fill="red" stroke="none" paint-order="stroke" d="M 0.5 0.5 L 20.5 0.5 L 20.5 20.5 L 0.5 20.5 L 0.5 0.5 Z"/>'
        '</svg>'
    )

@pytest.mark.selenium
def test_get_svg_with_svg_present(webdriver: WebDriver) -> None:
    def plot(color: str):
        return Plot(
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
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="40" height="20">'
            '<defs/>'
            '<path fill="rgb(0,0,0)" stroke="none" paint-order="stroke" d="M 0 0 L 40 0 L 40 20 L 0 20 L 0 0 Z" fill-opacity="0"/>'
            '<path fill="red" stroke="none" paint-order="stroke" d="M 5.5 5.5 L 15.5 5.5 L 15.5 15.5 L 5.5 15.5 L 5.5 5.5 Z"/>'
            '<g transform="matrix(1, 0, 0, 1, 20, 0)">'
                '<path fill="blue" stroke="none" paint-order="stroke" d="M 5.5 5.5 L 15.5 5.5 L 15.5 15.5 L 5.5 15.5 L 5.5 5.5 Z"/>'
            '</g>'
        '</svg>',
    ]

    assert svgs0 == svgs2
    assert svgs1 == svgs2

@pytest.mark.selenium
def test_get_svg_with_implicit_document_and_theme(webdriver: WebDriver) -> None:
    state = curstate()
    state.reset()
    try:
        state.document.theme = Theme(json={
            "attrs": {
                "Plot": {
                    "background_fill_color": "#2f3f4f",
                },
            },
        })

        def p(color: str):
            plot = Plot(
                x_range=Range1d(-1, 1), y_range=Range1d(-1, 1),
                height=200, width=200,
                toolbar_location=None,
                output_backend="svg",
            )
            plot.add_glyph(Circle(x=0, y=0, radius=1, fill_color=color))
            return plot

        [svg] = bie.get_svg(row([p("red"), p("blue")]), driver=webdriver)
        assert len(re.findall(r'fill="#2f3f4f"', svg)) == 2
    finally:
        state.reset()

@pytest.mark.selenium
def test_get_svgs_no_svg_present() -> None:
    from bokeh.io.webdriver import webdriver_control

    layout = Plot(x_range=Range1d(), y_range=Range1d(), height=20, width=20, toolbar_location=None)

    try:
        with silenced(MISSING_RENDERERS):
            svgs = bie.get_svgs(layout)
    finally:
        webdriver_control.reset()

    assert svgs == []

@pytest.mark.selenium
def test_get_svgs_with_svg_present(webdriver: WebDriver) -> None:
    def plot(color: str):
        return Plot(
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
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20">'
            '<defs/>'
            '<path fill="red" stroke="none" paint-order="stroke" d="M 5.5 5.5 L 15.5 5.5 L 15.5 15.5 L 5.5 15.5 L 5.5 5.5 Z"/>'
        '</svg>',
        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20">'
            '<defs/>'
            '<path fill="blue" stroke="none" paint-order="stroke" d="M 5.5 5.5 L 15.5 5.5 L 15.5 15.5 L 5.5 15.5 L 5.5 5.5 Z"/>'
        '</svg>',
    ]

    assert svgs0 == svgs2
    assert svgs1 == svgs2

@pytest.mark.selenium
def test_get_svgs_with_Legend__issue_14502(webdriver: WebDriver) -> None:
    def plot(color: str):
        return Plot(
            x_range=DataRange1d(), y_range=DataRange1d(),
            width=100, height=100,
            min_border=0,
            toolbar_location=None,
            outline_line_color=None,
            border_fill_color=None,
            output_backend="svg",
            renderers=[],
            center=[Legend(items=[LegendItem(label=f"Legend Item: {color}")])],
        )

    layout = row([plot("red"), plot("blue")])

    with silenced(MISSING_RENDERERS):
        svgs = bie.get_svgs(layout, driver=webdriver)

    assert len(svgs) == 2

    # can't compare svg output, because of random defs IDs (clip-path, etc.)
    assert "Legend Item: red" in svgs[0]
    assert "Legend Item: blue" in svgs[1]


# -- Playwright-backend tests -------------------------------------------------

def _call_in_fresh_thread[T](context: Literal["sync", "async"], fn: Callable[[], T]) -> T:
    def call() -> T:
        if context == "sync":
            return fn()

        async def call_async() -> T:
            return fn()

        return asyncio.run(call_async())

    with ThreadPoolExecutor(max_workers=1) as executor:
        return executor.submit(call).result(timeout=60)


@pytest.mark.skipif(not _has_playwright, reason="Playwright not installed")
class TestPlaywrightPNG:

    @pytest.mark.parametrize("dimensions", [(14, 14), (44, 44), (144, 144), (444, 444)])
    def test_screenshot_dimensions(self, dimensions: tuple[int, int], browser: Browser) -> None:
        width, height = dimensions
        border = 5

        layout = Plot(x_range=Range1d(), y_range=Range1d(),
                      height=width, width=height,
                      min_border=border,
                      toolbar_location=None,
                      outline_line_color=None, background_fill_color="#00ff00", border_fill_color="#00ff00")

        with silenced(MISSING_RENDERERS):
            png = bie.get_screenshot_as_png(layout, driver=browser)

        assert png.size == (width, height)
        data = png.tobytes()
        assert len(data) == 4*width*height
        # The HiDPI half-pixel transform antialiases the canvas and frame edges.
        green_pixel = b"\x00\xff\x00\xff"
        _assert_solid_region(png, (border + 1, border + 1, width - border, height - border), green_pixel)
        assert png.getpixel((border//2, border//2)) == tuple(green_pixel)

    def test_screenshot_with_glyph(self, browser: Browser) -> None:
        width, height = 144, 144
        border = 5

        layout = Plot(x_range=Range1d(-1, 1), y_range=Range1d(-1, 1),
                      height=width, width=height,
                      toolbar_location=None,
                      min_border=border,
                      outline_line_color=None, background_fill_color="#00ff00", border_fill_color="#00ff00")
        glyph = Rect(x="x", y="y", width=2, height=2, fill_color="#ff0000", line_color="#ff0000")
        source = ColumnDataSource(data=dict(x=[0], y=[0]))
        layout.add_glyph(source, glyph)

        png = bie.get_screenshot_as_png(layout, driver=browser)
        assert png.size == (width, height)

        # The layout is a green border surrounding a red center rectangle. The
        # HiDPI half-pixel transform antialiases their boundaries, so verify the
        # solid interior and a border pixel instead of counting edge pixels.
        red_pixel = b"\xff\x00\x00\xff"
        green_pixel = b"\x00\xff\x00\xff"
        _assert_solid_region(png, (border + 1, border + 1, width - border, height - border), red_pixel)
        assert png.getpixel((border//2, border//2)) == tuple(green_pixel)

    def test_screenshot_fractional_sizing(self, browser: Browser) -> None:
        div = Div(text="Something", styles=dict(width="100.64px", height="50.34px"))
        png = bie.get_screenshot_as_png(div, driver=browser)
        assert len(png.tobytes()) > 0


@pytest.mark.skipif(not _has_playwright, reason="Playwright not installed")
class TestPlaywrightSVG:

    def test_get_svg(self, browser: Browser) -> None:
        # Use a canvas-backend plot with a solid red background; the canvas
        # renderer emits a single <path> filled with that color, which gives
        # us a concrete marker to assert on.
        layout = Plot(
            x_range=Range1d(), y_range=Range1d(),
            toolbar_location=None, height=20, width=20,
            min_border=0, outline_line_color=None,
            border_fill_color=None, background_fill_color="red",
            output_backend="canvas",
        )
        with silenced(MISSING_RENDERERS):
            svgs = bie.get_svg(layout, driver=browser)
        assert isinstance(svgs, list) and len(svgs) == 1
        [svg] = svgs
        assert 'fill="red"' in svg

    def test_get_svgs(self, browser: Browser) -> None:
        # Add a Legend with a distinct label per plot so each SVG has a
        # text marker we can assert on. Mirrors the selenium-side
        # test_get_svgs_with_Legend__issue_14502.
        def plot(color: str):
            return Plot(
                x_range=DataRange1d(), y_range=DataRange1d(),
                width=100, height=100,
                min_border=0, toolbar_location=None,
                outline_line_color=None, border_fill_color=None,
                output_backend="svg", renderers=[],
                center=[Legend(items=[LegendItem(label=f"Legend Item: {color}")])],
            )
        layout = row([plot("red"), plot("blue")])
        with silenced(MISSING_RENDERERS):
            svgs = bie.get_svgs(layout, driver=browser)
        assert len(svgs) == 2
        assert "Legend Item: red" in svgs[0]
        assert "Legend Item: blue" in svgs[1]


@pytest.mark.skipif(not _has_playwright, reason="Playwright not installed")
@pytest.mark.parametrize("contexts", [("sync", "async"), ("async", "sync")])
def test_implicit_playwright_browser_across_execution_contexts__issues_15401_15402(
    tmp_path: Path,
    contexts: tuple[Literal["sync", "async"], Literal["sync", "async"]],
) -> None:
    layout = Plot(
        x_range=Range1d(), y_range=Range1d(),
        toolbar_location=None, height=20, width=20,
        min_border=0, outline_line_color=None,
        border_fill_color=None, background_fill_color="red",
        output_backend="canvas",
    )

    suffix = "-".join(contexts)
    svg_path = tmp_path / f"plot-{suffix}.svg"
    png_path = tmp_path / f"plot-{suffix}.png"

    def export_svg() -> list[str]:
        with silenced(MISSING_RENDERERS):
            return bie.export_svg(layout, filename=svg_path, backend="playwright")

    def export_png() -> str:
        with silenced(MISSING_RENDERERS):
            return bie.export_png(layout, filename=png_path, backend="playwright")

    async def browser_identity() -> int:
        assert bib.playwright_control._browser is not None
        return id(bib.playwright_control._browser)

    previous_policy = asyncio.get_event_loop_policy()
    if sys.platform == "win32":
        selector_policy = getattr(asyncio, "WindowsSelectorEventLoopPolicy")
        asyncio.set_event_loop_policy(selector_policy())

    bib._cleanup()
    try:
        svg_filenames = _call_in_fresh_thread(contexts[0], export_svg)
        first_browser = bib._playwright_thread.run(browser_identity)
        png_filename = _call_in_fresh_thread(contexts[1], export_png)
        second_browser = bib._playwright_thread.run(browser_identity)
    finally:
        bib._cleanup()
        if sys.platform == "win32":
            asyncio.set_event_loop_policy(previous_policy)

    assert svg_filenames == [str(svg_path)]
    assert 'fill="red"' in svg_path.read_text()
    assert png_filename == str(png_path)
    with PIL.Image.open(png_filename) as png:
        assert png.size == (20, 20)
    assert first_browser == second_browser


# -- Backend resolution tests --------------------------------------------------

class TestResolveBackend:

    def test_driver_forces_selenium(self) -> None:
        assert bie._resolve_backend(driver="fake_driver", backend=None) is bie._selenium_backend

    @pytest.mark.skipif(not _has_playwright, reason="Playwright not installed")
    def test_playwright_browser_forces_playwright(self, browser: Browser) -> None:
        assert bie._resolve_backend(driver=browser, backend=None) is bie._playwright_backend

    def test_explicit_backend_param(self) -> None:
        assert bie._resolve_backend(driver=None, backend="playwright") is bie._playwright_backend
        assert bie._resolve_backend(driver=None, backend="selenium") is bie._selenium_backend

    def test_invalid_backend_raises(self) -> None:
        with pytest.raises(ValueError, match="Invalid export backend"):
            bie._resolve_backend(driver=None, backend="puppeteer")


# -- Non-backend-specific tests ------------------------------------------------

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
