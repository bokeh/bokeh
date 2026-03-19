#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''Playwright-based browser backend for PNG/SVG export.

This module provides an alternative to the Selenium-based export backend.
Playwright is generally faster to install and run than Selenium.

To use::

    pip install playwright
    playwright install chromium

Then set ``BOKEH_EXPORT_BACKEND=playwright`` or pass ``backend="playwright"``
to export functions.

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
import asyncio
import atexit
import io
import queue
import threading
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    TypeVar,
)

# Bokeh imports
from ..resources import INLINE
from ..util.dependencies import import_required
from .state import curstate
from .util import (
    _BOKEH_LOADED_CHECK,
    _SVG_SCRIPT,
    _SVGS_SCRIPT,
    _VIEWPORT_SIZE_SCRIPT,
    _WAIT_SCRIPT,
    get_layout_html,
    tmp_html,
)

if TYPE_CHECKING:
    from PIL import Image
    from playwright.sync_api import (
        Browser,
        BrowserContext,
        Page,
        Playwright,
    )

    from ..document import Document
    from ..models.ui import UIElement
    from ..resources import Resources
    from .state import State

T = TypeVar("T")

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'get_screenshot_as_png',
    'get_svg',
    'get_svgs',
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
    timeout: int = 5,
    resources: Resources = INLINE,
    width: int | None = None,
    height: int | None = None,
    scale_factor: float = 1,
    state: State | None = None,
    browser: Browser | BrowserContext | None = None,
) -> Image.Image:
    '''Capture a Bokeh layout as a PNG image using Playwright.

    This is the Playwright equivalent of the Selenium code path in
    :func:`~bokeh.io.export.get_screenshot_as_png`.

    Args:
        browser: An optional Playwright ``Browser`` or ``BrowserContext``.
            If provided, pages are created from it instead of the global
            ``playwright_control`` instance.  This allows callers to
            supply a ``launch_persistent_context`` or a custom browser.
    '''
    theme = (state or curstate()).document.theme
    html = get_layout_html(obj, resources=resources, width=width, height=height, theme=theme)

    png_bytes, vw, vh, dpr = _playwright_render(html, "", timeout, scale_factor=scale_factor, browser=browser)

    from PIL import Image  # `PIL` is banned at the module level based on Ruff TID253
    return (Image.open(io.BytesIO(png_bytes))
                    .convert("RGBA")
                    .crop((0, 0, vw*dpr, vh*dpr))
                    .resize((int(vw*scale_factor), int(vh*scale_factor))))


def get_svg(
    obj: UIElement | Document,
    *,
    timeout: int = 5,
    resources: Resources = INLINE,
    width: int | None = None,
    height: int | None = None,
    state: State | None = None,
    browser: Browser | BrowserContext | None = None,
) -> list[str]:
    '''Export a Bokeh layout as a list of SVG strings using Playwright.

    This is the Playwright equivalent of the Selenium code path in
    :func:`~bokeh.io.export.get_svg`.
    '''
    theme = (state or curstate()).document.theme
    html = get_layout_html(obj, resources=resources, width=width, height=height, theme=theme)
    svgs: list[str] = _playwright_render(html, _SVG_SCRIPT(obj), timeout, browser=browser)[0]
    return svgs


def get_svgs(
    obj: UIElement | Document,
    *,
    timeout: int = 5,
    resources: Resources = INLINE,
    width: int | None = None,
    height: int | None = None,
    state: State | None = None,
    browser: Browser | BrowserContext | None = None,
) -> list[str]:
    '''Export SVG-enabled plots within a Bokeh layout using Playwright.

    This is the Playwright equivalent of the Selenium code path in
    :func:`~bokeh.io.export.get_svgs`.
    '''
    theme = (state or curstate()).document.theme
    html = get_layout_html(obj, resources=resources, width=width, height=height, theme=theme)
    svgs: list[str] = _playwright_render(html, _SVGS_SCRIPT, timeout, browser=browser)[0]
    return svgs


class _PlaywrightState:
    '''Manages a reusable Playwright browser instance for export operations.

    Mirrors :class:`~bokeh.io.webdriver._WebdriverState`.
    '''

    reuse: bool

    _playwright: Playwright | None
    _browser: Browser | None
    _scale_factor: float

    def __init__(self, *, reuse: bool = True) -> None:
        self.reuse = reuse
        self._playwright = None
        self._browser = None
        self._scale_factor = 1

    def get_page(self, *, scale_factor: float = 1) -> Page:
        '''Create a new browser page, launching the browser if needed.

        If the requested ``scale_factor`` exceeds the factor the current
        browser was launched with, the browser is relaunched.
        '''
        if (self._browser is not None and self._browser.is_connected()
                and scale_factor > self._scale_factor):
            # Need a higher DPI than the current browser was launched with.
            self.cleanup()
        browser = self._ensure_browser(scale_factor=scale_factor)
        return browser.new_page()

    def close_page(self, page: Page) -> None:
        '''Close a page after export is complete.'''
        if not page.is_closed():
            page.close()

    def cleanup(self) -> None:
        '''Shut down the browser and Playwright.'''
        if self._browser is not None:
            try:
                self._browser.close()
            except Exception:
                pass
            self._browser = None

        if self._playwright is not None:
            try:
                self._playwright.stop()
            except Exception:
                pass
            self._playwright = None

    def _ensure_browser(self, scale_factor: float = 1) -> Browser:
        if self._browser is not None and self._browser.is_connected():
            return self._browser

        self.cleanup()
        self._scale_factor = scale_factor

        sync_api = import_required(
            "playwright.sync_api",
            "To use the Playwright export backend you need playwright "
            "('pip install playwright' then 'playwright install chromium')",
        )

        self._playwright = sync_api.sync_playwright().start()

        try:
            self._browser = self._playwright.chromium.launch(
                args=[
                    "--hide-scrollbars",
                    f"--force-device-scale-factor={scale_factor}",
                    "--force-color-profile=srgb",
                ],
            )
        except Exception as e:
            self.cleanup()
            raise RuntimeError(
                "Failed to launch Playwright Chromium. Make sure browser binaries "
                "are installed by running 'playwright install chromium'.",
            ) from e

        return self._browser


def execute_script(page: Page, script: str) -> Any:
    '''Execute JavaScript in the page and return the result.

    Wraps Selenium-style scripts (with bare top-level ``return``) in an
    IIFE so they work with Playwright's ``evaluate``.
    '''
    stripped = script.strip()
    if stripped.startswith("return ") or stripped.startswith("return\n") or "\nreturn " in stripped:
        script = f"(() => {{ {script} }})()"
    return page.evaluate(script)


def wait_until_render_complete(page: Page, timeout: int) -> None:
    '''Wait for Bokeh to load and render, mirroring the Selenium backend.'''
    timeout_ms = timeout * 1000

    bokeh_loaded_fn = _BOKEH_LOADED_CHECK.replace("return ", "", 1)

    try:
        page.wait_for_function(
            f"() => {{ return {bokeh_loaded_fn}; }}",
            timeout=timeout_ms,
        )
    except Exception as e:
        raise RuntimeError(
            "Bokeh was not loaded in time. Something may have gone wrong.",
        ) from e

    page.evaluate(f"() => {{ {_WAIT_SCRIPT} }}")

    try:
        page.wait_for_function(
            "() => window._bokeh_render_complete",
            timeout=timeout_ms,
        )
    except Exception:
        log.warning(
            "The Playwright page raised a timeout while waiting for "
            "a 'bokeh:idle' event to signify that the layout has rendered. "
            "Something may have gone wrong.",
        )


def maximize_viewport(page: Page) -> tuple[int, int, int]:
    '''Resize viewport to fit the Bokeh layout. Returns (width, height, dpr).'''
    [w, h, dpr] = execute_script(page, _VIEWPORT_SIZE_SCRIPT)
    page.set_viewport_size({"width": w + 100, "height": h + 100})
    return (w, h, dpr)


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _playwright_render(
    html: str, script: str, timeout: int, *,
    scale_factor: float = 1,
    browser: Browser | BrowserContext | None = None,
) -> tuple[Any, int, int, int]:
    '''Run a single Playwright export: navigate, wait for render, execute script.

    Args:
        html: The full Bokeh HTML to render.
        script: JavaScript to execute after render. If empty, captures a
            PNG screenshot instead.
        timeout: Seconds to wait for Bokeh to render.
        scale_factor: Device scale factor for the browser.
        browser: An optional Playwright ``Browser`` or ``BrowserContext``
            to create pages from.  When *None*, the global
            ``playwright_control`` instance is used.

    Returns:
        (result, width, height, dpr) where result is the script return value
        or PNG bytes if script is empty.
    '''
    user_browser = browser is not None

    def _do_export() -> tuple[Any, int, int, int]:
        if user_browser:
            page = browser.new_page()  # type: ignore[union-attr]
        else:
            page = playwright_control.get_page(scale_factor=scale_factor)
        try:
            with tmp_html() as tmp:
                with tmp as f:
                    f.write(html.encode("utf-8"))

                page.goto(f"file://{tmp.name}")
                wait_until_render_complete(page, timeout)
                [w, h, dpr] = maximize_viewport(page)
                result = page.screenshot() if not script else execute_script(page, script)
        finally:
            if not page.is_closed():
                page.close()
        return (result, w, h, dpr)

    if _in_async_context() and not user_browser:
        return _playwright_thread.run(_do_export)
    return _do_export()


def _in_async_context() -> bool:
    '''Return True if there is a running asyncio event loop (e.g. Jupyter).'''
    try:
        asyncio.get_running_loop()
        return True
    except RuntimeError:
        return False


class _PlaywrightThread:
    '''A dedicated long-lived daemon thread for Playwright operations.

    Playwright's sync API starts its own event loop, which conflicts with
    an already-running loop (e.g. Jupyter). This class keeps a single
    background thread alive so that all Playwright objects (browser, pages)
    remain valid across multiple export calls.
    '''

    def __init__(self) -> None:
        self._thread: threading.Thread | None = None
        self._queue: queue.Queue[tuple[Callable[..., Any], tuple[Any, ...], queue.Queue[Any]] | None] = queue.Queue()
        self._started = False

    def run(self, fn: Callable[..., T], *args: Any) -> T:
        '''Submit a callable to the Playwright thread and block for the result.'''
        self._ensure_started()
        result_q: queue.Queue[tuple[str, Any]] = queue.Queue()
        self._queue.put((fn, args, result_q))
        status, value = result_q.get()
        if status == "error":
            raise value
        return value

    def shutdown(self) -> None:
        if self._started:
            self._queue.put(None)
            if self._thread is not None:
                self._thread.join(timeout=5)
            self._started = False
            self._thread = None

    def _ensure_started(self) -> None:
        if not self._started:
            self._thread = threading.Thread(target=self._worker, daemon=True)
            self._thread.start()
            self._started = True

    def _worker(self) -> None:
        while True:
            item = self._queue.get()
            if item is None:
                break
            fn, args, result_q = item
            try:
                result_q.put(("ok", fn(*args)))
            except BaseException as e:
                result_q.put(("error", e))


_playwright_thread = _PlaywrightThread()


def _cleanup() -> None:
    '''Shutdown Playwright and the background thread at exit.'''
    try:
        if _playwright_thread._started:
            _playwright_thread.run(playwright_control.cleanup)
        else:
            playwright_control.cleanup()
    except Exception:
        pass
    _playwright_thread.shutdown()


#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

playwright_control = _PlaywrightState()

atexit.register(_cleanup)
