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
import os
import queue
import sys
import threading
from collections.abc import Callable, Coroutine
from typing import TYPE_CHECKING, Any, cast

# Bokeh imports
from ..resources import INLINE
from ..util.dependencies import import_required
from .state import curstate
from .util import (
    _BOKEH_LOADED_EXPR,
    _ROOT_VIEW_BBOX_SCRIPT,
    _SVG_SCRIPT,
    _SVGS_SCRIPT,
    _WAIT_SCRIPT,
    get_layout_html,
    tmp_html,
)

if TYPE_CHECKING:
    from PIL import Image
    from playwright.async_api import (
        Browser as AsyncBrowser,
        Page as AsyncPage,
        Playwright as AsyncPlaywright,
    )
    from playwright.sync_api import Browser, BrowserContext, Page

    from ..document import Document
    from ..models.ui import UIElement
    from ..resources import Resources
    from .state import State

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
    driver: Browser | BrowserContext | None = None,
    timeout: int = 5,
    resources: Resources = INLINE,
    width: int | None = None,
    height: int | None = None,
    scale_factor: float = 1,
    state: State | None = None,
) -> Image.Image:
    '''Capture a Bokeh layout as a PNG image using Playwright.

    This is the Playwright equivalent of the Selenium code path in
    :func:`~bokeh.io.export.get_screenshot_as_png`.

    Args:
        driver: An optional Playwright ``Browser`` or ``BrowserContext``.
            If provided, pages are created from it instead of the global
            ``playwright_control`` instance.  This allows callers to
            supply a ``launch_persistent_context`` or a custom browser.
    '''
    theme = (state or curstate()).document.theme
    html = get_layout_html(obj, resources=resources, width=width, height=height, theme=theme)

    png_bytes, vw, vh, dpr = _playwright_render(html, "", timeout, scale_factor=scale_factor, driver=driver)

    from PIL import Image  # `PIL` is banned at the module level based on Ruff TID253
    return (Image
        .open(io.BytesIO(png_bytes))
        .convert("RGBA")
        .crop((0, 0, vw*dpr, vh*dpr))
        .resize((int(vw*scale_factor), int(vh*scale_factor))))


def get_svg(
    obj: UIElement | Document,
    *,
    driver: Browser | BrowserContext | None = None,
    timeout: int = 5,
    resources: Resources = INLINE,
    width: int | None = None,
    height: int | None = None,
    state: State | None = None,
) -> list[str]:
    '''Export a Bokeh layout as a list of SVG strings using Playwright.

    This is the Playwright equivalent of the Selenium code path in
    :func:`~bokeh.io.export.get_svg`.
    '''
    theme = (state or curstate()).document.theme
    html = get_layout_html(obj, resources=resources, width=width, height=height, theme=theme)
    svgs: list[str] = _playwright_render(html, _SVG_SCRIPT(obj), timeout, driver=driver)[0]
    return svgs


def get_svgs(
    obj: UIElement | Document,
    *,
    driver: Browser | BrowserContext | None = None,
    timeout: int = 5,
    resources: Resources = INLINE,
    width: int | None = None,
    height: int | None = None,
    state: State | None = None,
) -> list[str]:
    '''Export SVG-enabled plots within a Bokeh layout using Playwright.

    This is the Playwright equivalent of the Selenium code path in
    :func:`~bokeh.io.export.get_svgs`.
    '''
    theme = (state or curstate()).document.theme
    html = get_layout_html(obj, resources=resources, width=width, height=height, theme=theme)
    svgs: list[str] = _playwright_render(html, _SVGS_SCRIPT, timeout, driver=driver)[0]
    return svgs


class _PlaywrightState:
    '''Manages a reusable Playwright browser instance for export operations.

    The state is owned by ``_playwright_thread``. All methods must be called
    on that thread so that Playwright's event loop and browser objects stay on
    the thread where they were created.
    '''

    reuse: bool

    _playwright: AsyncPlaywright | None
    _browser: AsyncBrowser | None
    _scale_factor: float

    def __init__(self, *, reuse: bool = True) -> None:
        self.reuse = reuse
        self._playwright = None
        self._browser = None
        self._scale_factor = 1

    async def get_page(self, *, scale_factor: float = 1) -> AsyncPage:
        '''Create a new browser page, launching the browser if needed.

        If the requested ``scale_factor`` exceeds the factor the current
        browser was launched with, the browser is relaunched.
        '''
        if (self._browser is not None and self._browser.is_connected()
                and scale_factor > self._scale_factor):
            # Need a higher DPI than the current browser was launched with.
            await self.cleanup()
        browser = await self._ensure_browser(scale_factor=scale_factor)
        return await browser.new_page()

    async def close_page(self, page: AsyncPage) -> None:
        '''Close a page after export is complete.'''
        if not page.is_closed():
            await page.close()

    async def cleanup(self) -> None:
        '''Shut down the browser and Playwright.'''
        if self._browser is not None:
            try:
                await self._browser.close()
            except Exception:
                pass
            self._browser = None

        if self._playwright is not None:
            try:
                await self._playwright.stop()
            except Exception:
                pass
            self._playwright = None

    async def _ensure_browser(self, scale_factor: float = 1) -> AsyncBrowser:
        if self._browser is not None and self._browser.is_connected():
            return self._browser

        await self.cleanup()
        self._scale_factor = scale_factor

        async_api = import_required(
            "playwright.async_api",
            "To use the Playwright export backend you need playwright "
            "('pip install playwright' then 'playwright install chromium')",
        )

        playwright = await async_api.async_playwright().start()
        self._playwright = playwright

        try:
            browser = await playwright.chromium.launch(
                args=[
                    "--hide-scrollbars",
                    f"--force-device-scale-factor={scale_factor}",
                    "--force-color-profile=srgb",
                ],
            )
            self._browser = browser
        except Exception as e:
            await self.cleanup()
            raise RuntimeError(
                "Failed to launch Playwright Chromium. Make sure browser binaries "
                "are installed by running 'playwright install chromium'.",
            ) from e

        return browser


def _wrap_function(script: str) -> str:
    stripped = script.strip()
    if stripped.startswith("return ") or stripped.startswith("return\n") or "\nreturn " in stripped:
        return f"() => {{ {script} }}"
    return script


def execute_script(page: Page, script: str) -> Any:
    '''Execute JavaScript in the page and return the result.

    Wraps Selenium-style scripts (with bare top-level ``return``) in a
    function so they work with Playwright's ``evaluate``.
    '''
    return page.evaluate(_wrap_function(script))


async def _execute_script(page: AsyncPage, script: str) -> Any:
    return await page.evaluate(_wrap_function(script))


def wait_until_render_complete(page: Page, timeout: int) -> None:
    '''Wait for Bokeh to load and render, mirroring the Selenium backend.'''
    timeout_ms = timeout * 1000

    try:
        page.wait_for_function(
            _wrap_function(f"return {_BOKEH_LOADED_EXPR}"),
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


async def _wait_until_render_complete(page: AsyncPage, timeout: int) -> None:
    timeout_ms = timeout * 1000

    try:
        await page.wait_for_function(
            _wrap_function(f"return {_BOKEH_LOADED_EXPR}"),
            timeout=timeout_ms,
        )
    except Exception as e:
        raise RuntimeError(
            "Bokeh was not loaded in time. Something may have gone wrong.",
        ) from e

    await page.evaluate(f"() => {{ {_WAIT_SCRIPT} }}")

    try:
        await page.wait_for_function(
            "() => window._bokeh_render_complete",
            timeout=timeout_ms,
        )
    except Exception:
        log.warning(
            "The Playwright page raised a timeout while waiting for "
            "a 'bokeh:idle' event to signify that the layout has rendered. "
            "Something may have gone wrong.",
        )


def maximize_viewport(page: Page) -> tuple[float, float, int, int, int]:
    '''Resize viewport to fit the Bokeh layout. Returns (x, y, width, height, dpr).'''
    [_, _, w, h, _] = execute_script(page, _ROOT_VIEW_BBOX_SCRIPT)
    page.set_viewport_size({"width": w + 100, "height": h + 100})
    [x, y, w, h, dpr] = execute_script(page, _ROOT_VIEW_BBOX_SCRIPT)
    return (x, y, w, h, dpr)


async def _maximize_viewport(page: AsyncPage) -> tuple[float, float, int, int, int]:
    [_, _, w, h, _] = await _execute_script(page, _ROOT_VIEW_BBOX_SCRIPT)
    await page.set_viewport_size({"width": w + 100, "height": h + 100})
    [x, y, w, h, dpr] = await _execute_script(page, _ROOT_VIEW_BBOX_SCRIPT)
    return (x, y, w, h, dpr)


#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _playwright_render(
    html: str, script: str, timeout: int, *,
    scale_factor: float = 1,
    driver: Browser | BrowserContext | None = None,
) -> tuple[Any, int, int, int]:
    '''Run a single Playwright export: navigate, wait for render, execute script.

    Args:
        html: The full Bokeh HTML to render.
        script: JavaScript to execute after render. If empty, captures a
            PNG screenshot instead.
        timeout: Seconds to wait for Bokeh to render.
        scale_factor: Device scale factor for the browser.
        driver: An optional Playwright ``Browser`` or ``BrowserContext``
            to create pages from.  When *None*, the global
            ``playwright_control`` instance is used.

    Returns:
        (result, width, height, dpr) where result is the script return value
        or PNG bytes if script is empty.
    '''
    def _do_export(user_driver: Browser | BrowserContext) -> tuple[Any, int, int, int]:
        page = user_driver.new_page()
        try:
            with tmp_html() as tmp:
                with tmp as f:
                    f.write(html.encode("utf-8"))

                page.goto(f"file://{tmp.name}")
                wait_until_render_complete(page, timeout)
                [x, y, w, h, dpr] = maximize_viewport(page)
                if script:
                    result = execute_script(page, script)
                else:
                    result = page.screenshot(clip={"x": x, "y": y, "width": w, "height": h})
        finally:
            if not page.is_closed():
                page.close()
        return (result, w, h, dpr)

    async def _do_export_async() -> tuple[Any, int, int, int]:
        page = await playwright_control.get_page(scale_factor=scale_factor)
        try:
            with tmp_html() as tmp:
                with tmp as f:
                    f.write(html.encode("utf-8"))

                await page.goto(f"file://{tmp.name}")
                await _wait_until_render_complete(page, timeout)
                [x, y, w, h, dpr] = await _maximize_viewport(page)
                if script:
                    result = await _execute_script(page, script)
                else:
                    result = await page.screenshot(clip={"x": x, "y": y, "width": w, "height": h})
        finally:
            await playwright_control.close_page(page)
        return (result, w, h, dpr)

    if driver is not None:
        return _do_export(driver)
    return _playwright_thread.run(_do_export_async)


def _new_event_loop() -> asyncio.AbstractEventLoop:
    if sys.platform == "win32":
        loop_factory = cast("Callable[[], asyncio.AbstractEventLoop]", getattr(asyncio, "ProactorEventLoop"))
        loop = loop_factory()
    else:
        loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop


class _PlaywrightThread:
    '''A dedicated long-lived daemon thread for Playwright operations.

    The worker runs Playwright's async API on an event loop that Bokeh owns.
    On Windows it explicitly uses a proactor loop because Playwright launches
    its driver as an asyncio subprocess, which selector loops don't support.
    '''

    def __init__(self) -> None:
        self._reset()

    def _reset(self) -> None:
        self._pid = os.getpid()
        self._thread: threading.Thread | None = None
        self._queue: queue.Queue[
            tuple[Callable[..., Coroutine[Any, Any, Any]], tuple[Any, ...], queue.Queue[Any]] | None
        ] = queue.Queue()
        self._lifecycle_lock = threading.Lock()
        self._stopped = threading.Event()
        self._stopped.set()
        self._started = False
        self._stopping = False

    def run[T](self, fn: Callable[..., Coroutine[Any, Any, T]], *args: Any) -> T:
        '''Submit a callable to the Playwright thread and block for the result.'''
        self._ensure_current_process()
        result_q = queue.Queue[tuple[str, Any]]()
        with self._lifecycle_lock:
            if self._stopping:
                raise RuntimeError("Playwright worker is shutting down")
            self._ensure_started()
            self._queue.put((fn, args, result_q))
        status, value = result_q.get()
        if status == "error":
            raise value
        return value

    def shutdown(self, finalizer: Callable[..., Coroutine[Any, Any, Any]] | None = None) -> None:
        '''Stop the worker after completing already-submitted work.'''
        self._ensure_current_process()

        wait_until_stopped = False
        finalizer_q: queue.Queue[tuple[str, Any]] | None = None
        thread: threading.Thread | None = None

        with self._lifecycle_lock:
            if self._stopping:
                wait_until_stopped = True
            elif not self._started:
                return
            else:
                thread = self._thread
                if thread is threading.current_thread():
                    raise RuntimeError("Playwright worker cannot shut itself down")
                self._stopping = True
                if finalizer is not None:
                    finalizer_q = queue.Queue()
                    self._queue.put((finalizer, (), finalizer_q))
                # The sentinel is queued while submissions are excluded by the
                # lifecycle lock, so no work can be stranded behind it.
                self._queue.put(None)

        if wait_until_stopped:
            self._stopped.wait()
            return

        finalizer_result: tuple[str, Any] | None = None
        if finalizer_q is not None:
            finalizer_result = finalizer_q.get()

        assert thread is not None
        thread.join()

        with self._lifecycle_lock:
            self._thread = None
            self._queue = queue.Queue()
            self._started = False
            self._stopping = False
            self._stopped.set()

        if finalizer_result is not None and finalizer_result[0] == "error":
            raise finalizer_result[1]

    def _ensure_current_process(self) -> None:
        if self._pid != os.getpid():
            # Only the thread that called fork survives in the child. Discard
            # inherited queues and locks without touching the parent's worker.
            self._reset()

    def _ensure_started(self) -> None:
        thread = self._thread
        if self._started and thread is not None and thread.is_alive():
            return

        self._thread = None
        self._queue = queue.Queue()
        self._started = False

        startup_q = queue.Queue[tuple[str, Any]]()
        thread = threading.Thread(target=self._worker, args=(startup_q,), daemon=True)
        self._thread = thread
        thread.start()

        status, value = startup_q.get()
        if status == "error":
            thread.join()
            self._thread = None
            self._queue = queue.Queue()
            raise value

        self._stopped.clear()
        self._started = True

    def _worker(self, startup_q: queue.Queue[tuple[str, Any]]) -> None:
        started = False
        try:
            with asyncio.Runner(loop_factory=_new_event_loop) as runner:
                startup_q.put(("ok", None))
                started = True
                while True:
                    item = self._queue.get()
                    if item is None:
                        break
                    fn, args, result_q = item
                    try:
                        result_q.put(("ok", runner.run(fn(*args))))
                    except (Exception, asyncio.CancelledError) as e:
                        result_q.put(("error", e))
        except Exception as e:
            if not started:
                startup_q.put(("error", e))
            else:
                raise


_playwright_thread = _PlaywrightThread()


def _cleanup() -> None:
    '''Shutdown Playwright and the background thread at exit.'''
    try:
        _playwright_thread.shutdown(playwright_control.cleanup)
    except Exception:
        pass


#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

playwright_control = _PlaywrightState()


def _reset_after_fork() -> None:
    global playwright_control
    _playwright_thread._reset()
    playwright_control = _PlaywrightState()


_register_at_fork = cast("Callable[..., None] | None", getattr(os, "register_at_fork", None))
if _register_at_fork is not None:
    _register_at_fork(after_in_child=_reset_after_fork)

atexit.register(_cleanup)
