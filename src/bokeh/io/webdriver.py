#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import atexit
import io
import os
from os.path import devnull
from shutil import which
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from PIL import Image
    from selenium.webdriver.remote.webdriver import WebDriver

    from ..document import Document
    from ..models.ui import UIElement
    from ..resources import Resources
    from .state import State

# Bokeh imports
from ..resources import INLINE
from ..settings import settings
from ..util.dependencies import import_required
from .state import curstate
from .util import (
    _BOKEH_IDLE_CHECK,
    _BOKEH_LOADED_CHECK,
    _ROOT_VIEW_BBOX_SCRIPT,
    _SVG_SCRIPT,
    _SVGS_SCRIPT,
    get_layout_html,
    tmp_html,
)

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

type DriverKind = Literal["firefox", "chromium"]

__all__ = (
    'get_screenshot_as_png',
    'get_svg',
    'get_svgs',
    'webdriver_control',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def get_screenshot_as_png(
    obj: UIElement | Document,
    *,
    driver: WebDriver | None = None,
    timeout: int = 5,
    resources: Resources = INLINE,
    width: int | None = None,
    height: int | None = None,
    scale_factor: float = 1,
    state: State | None = None,
) -> Image.Image:
    '''Capture a Bokeh layout as a PNG image using Selenium.'''
    theme = (state or curstate()).document.theme
    html = get_layout_html(obj, resources=resources, width=width, height=height, theme=theme)
    return get_screenshot_as_png_from_html(html, driver=driver, timeout=timeout, scale_factor=scale_factor)


def get_screenshot_as_png_from_html(
    html: str,
    *,
    driver: WebDriver | None = None,
    timeout: int = 5,
    scale_factor: float = 1,
) -> Image.Image:
    '''Capture a fully assembled Bokeh HTML document as one PNG image.'''
    with tmp_html() as tmp:
        with tmp as f:
            f.write(html.encode("utf-8"))

        if driver is not None:
            web_driver = driver
            if not scale_factor_less_than_web_driver_device_pixel_ratio(scale_factor, web_driver):
                device_pixel_ratio = get_web_driver_device_pixel_ratio(web_driver)
                raise ValueError(f'Expected the web driver to have a device pixel ratio greater than {scale_factor}. '
                                 f'Was given a web driver with a device pixel ratio of {device_pixel_ratio}.')
        else:
            web_driver = webdriver_control.get(scale_factor=scale_factor)
        web_driver.maximize_window()
        web_driver.get(f"file://{tmp.name}")
        wait_until_render_complete(web_driver, timeout)
        [w, h, dpr] = _maximize_viewport(web_driver)
        png = web_driver.get_screenshot_as_png()

    from PIL import Image  # `PIL` is banned at the module level based on Ruff TID253
    return (Image
        .open(io.BytesIO(png))
        .convert("RGBA")
        .crop((0, 0, w*dpr, h*dpr))
        .resize((int(w*scale_factor), int(h*scale_factor))))


def get_svg(
    obj: UIElement | Document,
    *,
    driver: WebDriver | None = None,
    timeout: int = 5,
    resources: Resources = INLINE,
    width: int | None = None,
    height: int | None = None,
    state: State | None = None,
) -> list[str]:
    '''Export a Bokeh layout as a list of SVG strings using Selenium.'''
    with tmp_html() as tmp:
        theme = (state or curstate()).document.theme
        html = get_layout_html(obj, resources=resources, width=width, height=height, theme=theme)
        with tmp as f:
            f.write(html.encode("utf-8"))

        web_driver = driver if driver is not None else webdriver_control.get()
        web_driver.get(f"file://{tmp.name}")
        wait_until_render_complete(web_driver, timeout)
        svgs: list[str] = web_driver.execute_script(_SVG_SCRIPT(obj))

    return svgs


def get_svgs(
    obj: UIElement | Document,
    *,
    driver: WebDriver | None = None,
    timeout: int = 5,
    resources: Resources = INLINE,
    width: int | None = None,
    height: int | None = None,
    state: State | None = None,
) -> list[str]:
    '''Export SVG-enabled plots within a Bokeh layout using Selenium.'''
    with tmp_html() as tmp:
        theme = (state or curstate()).document.theme
        html = get_layout_html(obj, resources=resources, width=width, height=height, theme=theme)
        with tmp as f:
            f.write(html.encode("utf-8"))

        web_driver = driver if driver is not None else webdriver_control.get()
        web_driver.get(f"file://{tmp.name}")
        wait_until_render_complete(web_driver, timeout)
        svgs: list[str] = web_driver.execute_script(_SVGS_SCRIPT)

    return svgs


def wait_until_render_complete(driver: WebDriver, timeout: int) -> None:
    '''Wait for Bokeh to load and render.'''
    from selenium.common.exceptions import TimeoutException
    from selenium.webdriver.support.wait import WebDriverWait

    def is_bokeh_loaded(driver: WebDriver) -> bool:
        result: bool = driver.execute_script(_BOKEH_LOADED_CHECK)
        return result

    try:
        WebDriverWait(driver, timeout, poll_frequency=0.1).until(is_bokeh_loaded)
    except TimeoutException as e:
        _log_console(driver)
        error = driver.execute_script('return window._bokeh_export_error ?? null')
        if isinstance(error, str):
            raise RuntimeError(f"Bokeh frontend snapshot render failed: {error}") from e
        raise RuntimeError('Bokeh was not loaded in time. Something may have gone wrong.') from e

    def is_bokeh_render_complete(driver: WebDriver) -> bool:
        result: bool = driver.execute_script(_BOKEH_IDLE_CHECK)
        return result

    try:
        WebDriverWait(driver, timeout, poll_frequency=0.1).until(is_bokeh_render_complete)
    except TimeoutException:
        log.warning("The webdriver raised a TimeoutException while waiting for "
                    "a 'bokeh:idle' event to signify that the layout has rendered. "
                    "Something may have gone wrong.")
    finally:
        _log_console(driver)


def create_firefox_webdriver(scale_factor: float = 1) -> WebDriver:
    import selenium
    from packaging.version import Version
    from selenium.webdriver.firefox.options import Options as FirefoxOptions
    from selenium.webdriver.firefox.service import Service as FirefoxService
    from selenium.webdriver.firefox.webdriver import WebDriver as Firefox

    firefox = which("firefox")
    if firefox is None:
        raise RuntimeError("firefox is not installed or not present on PATH")

    geckodriver = which("geckodriver")
    if geckodriver is None:
        raise RuntimeError("geckodriver is not installed or not present on PATH")

    if Version(selenium.__version__) >= Version("4.11"):
        # Selenium 4.11 defaults to null output:
        # https://github.com/SeleniumHQ/selenium/pull/12103
        service = FirefoxService()
    else:
        service = FirefoxService(log_path=devnull)

    options = FirefoxOptions()
    options.add_argument("--headless")
    options.set_preference('layout.css.devPixelsPerPx', f'{scale_factor}')

    return Firefox(service=service, options=options)


def create_chromium_webdriver(extra_options: list[str] | None = None, scale_factor: float = 1) -> WebDriver:
    from selenium.webdriver.chrome.options import Options as ChromeOptions
    from selenium.webdriver.chrome.service import Service as ChromeService
    from selenium.webdriver.chrome.webdriver import WebDriver as Chrome

    executable_path = settings.chromedriver_path()
    if executable_path is None:
        for executable in ["chromedriver", "chromium.chromedriver", "chromedriver-binary"]:
            executable_path = which(executable)
            if executable_path is not None:
                break
        else:
            raise RuntimeError("chromedriver or its variant is not installed or not present on PATH; "
                               "use BOKEH_CHROMEDRIVER_PATH to specify a customized chromedriver's location")

    service = ChromeService(executable_path)

    options = ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--hide-scrollbars")
    options.add_argument(f"--force-device-scale-factor={scale_factor}")
    options.add_argument("--force-color-profile=srgb")
    if extra_options:
        for op in extra_options:
            options.add_argument(op)

    if os.getenv("BOKEH_IN_DOCKER") == "1":
        options.add_argument("--no-sandbox")

    return Chrome(service=service, options=options)


def scale_factor_less_than_web_driver_device_pixel_ratio(scale_factor: float, web_driver: WebDriver) -> bool:
    device_pixel_ratio = get_web_driver_device_pixel_ratio(web_driver)
    return device_pixel_ratio >= scale_factor


def get_web_driver_device_pixel_ratio(web_driver: WebDriver) -> float:
    device_pixel_ratio: float = web_driver.execute_script('return window.devicePixelRatio')
    return device_pixel_ratio

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _log_console(driver: WebDriver) -> None:
    levels = {'WARNING', 'ERROR', 'SEVERE'}
    try:
        driver_logs = driver.get_log('browser')
    except Exception:
        return
    messages = [driver_log.get("message") for driver_log in driver_logs if driver_log.get('level') in levels]
    if len(messages) > 0:
        log.warning("There were browser warnings and/or errors that may have affected your export")
        for message in messages:
            log.warning(message)


def _maximize_viewport(web_driver: WebDriver) -> tuple[int, int, int]:
    _, _, w, h, dpr = web_driver.execute_script(_ROOT_VIEW_BBOX_SCRIPT)
    viewport_size = (w, h, dpr)
    calculate_window_size = """\
        const [width, height, dpr] = arguments
        return [
            // XXX: outer{Width,Height} can be 0 in headless mode under certain window managers
            Math.round(Math.max(0, window.outerWidth - window.innerWidth) + width*dpr),
            Math.round(Math.max(0, window.outerHeight - window.innerHeight) + height*dpr),
        ]
    """
    [width, height] = web_driver.execute_script(calculate_window_size, *viewport_size)
    eps = 100 # XXX: can't set window size exactly in certain window managers, crop it to size later
    web_driver.set_window_size(width + eps, height + eps)
    return viewport_size


def _try_create_firefox_webdriver(scale_factor: float = 1) -> WebDriver | None:
    try:
        return create_firefox_webdriver(scale_factor=scale_factor)
    except Exception:
        return None

def _try_create_chromium_webdriver(scale_factor: float = 1) -> WebDriver | None:
    try:
        return create_chromium_webdriver(scale_factor=scale_factor)
    except Exception:
        return None

class _WebdriverState:

    reuse: bool
    kind: DriverKind | None

    current: WebDriver | None
    _drivers: set[WebDriver]

    def __init__(self, *, kind: DriverKind | None = None, reuse: bool = True) -> None:
        self.kind = kind
        self.reuse = reuse
        self.current = None
        self._drivers = set()

    def terminate(self, driver: WebDriver) -> None:
        self._drivers.remove(driver)
        driver.quit()

    def reset(self) -> None:
        if self.current is not None:
            self.terminate(self.current)
            self.current = None

    def get(self, scale_factor: float = 1) -> WebDriver:
        if not self.reuse or self.current is None or not scale_factor_less_than_web_driver_device_pixel_ratio(
                scale_factor, self.current):
            self.reset()
            self.current = self.create(scale_factor=scale_factor)
        return self.current

    def create(self, kind: DriverKind | None = None, scale_factor: float = 1) -> WebDriver:
        driver = self._create(kind, scale_factor=scale_factor)
        self._drivers.add(driver)
        return driver

    def _create(self, kind: DriverKind | None, scale_factor: float = 1) -> WebDriver:
        import_required("selenium.webdriver",
                        "To use bokeh.io image export functions you need selenium "
                        "('conda install selenium' or 'pip install selenium')")

        driver_kind = kind or self.kind

        if driver_kind is None:
            driver = _try_create_chromium_webdriver(scale_factor=scale_factor)
            if driver is not None:
                self.kind = "chromium"
                return driver

            driver = _try_create_firefox_webdriver(scale_factor=scale_factor)
            if driver is not None:
                self.kind = "firefox"
                return driver

            raise RuntimeError("Neither firefox and geckodriver nor a variant of chromium browser and " \
                               "chromedriver are available on system PATH. You can install the former " \
                               "with 'conda install -c conda-forge firefox geckodriver'.")
        elif driver_kind == "chromium":
            return create_chromium_webdriver(scale_factor=scale_factor)
        elif driver_kind == "firefox":
            return create_firefox_webdriver(scale_factor=scale_factor)
        else:
            raise ValueError(f"'{driver_kind}' is not a recognized webdriver kind")

    def cleanup(self) -> None:
        self.reset()
        for driver in list(self._drivers):
            self.terminate(driver)

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

webdriver_control = _WebdriverState()

atexit.register(lambda: webdriver_control.cleanup())
