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
import os
from os.path import abspath, expanduser, splitext
from types import ModuleType
from typing import TYPE_CHECKING, Literal

# Bokeh imports
from ..resources import INLINE
from ..settings import settings
from ..util.dependencies import import_optional
from . import browser as _playwright_backend, webdriver as _selenium_backend
from .util import default_filename, get_layout_html

if TYPE_CHECKING:
    from PIL import Image
    from selenium.webdriver.remote.webdriver import WebDriver

    try:
        from playwright.sync_api import Browser, BrowserContext
    except ImportError:
        from typing import (  # type: ignore[assignment]
            Any as Browser,
            Any as BrowserContext,
        )

    DriverLike = WebDriver | Browser | BrowserContext

    from ..core.types import PathLike
    from ..document import Document
    from ..models.ui import UIElement
    from ..resources import Resources
    from .state import State

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

ExportBackendType = Literal["selenium", "playwright"]

__all__ = (
    'export_png',
    'export_svg',
    'export_svgs',
    'get_layout_html',
    'get_screenshot_as_png',
    'get_svgs',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def export_png(obj: UIElement | Document, *, filename: PathLike | None = None, width: int | None = None,
        height: int | None = None, scale_factor: float = 1, webdriver: DriverLike | None = None,
        timeout: int = 5, state: State | None = None, backend: ExportBackendType | None = None) -> str:
    ''' Export the ``UIElement`` object or document as a PNG.

    If the filename is not given, it is derived from the script name (e.g.
    ``/foo/myplot.py`` will create ``/foo/myplot.png``)

    Args:
        obj (UIElement or Document) : a Layout (Row/Column), Plot or Widget
            object or Document to export.

        filename (PathLike, e.g. str, Path, optional) : filename to save document under (default: None)
            If None, infer from the filename.

        width (int) : the desired width of the exported layout obj only if
            it's a Plot instance. Otherwise the width kwarg is ignored.

        height (int) : the desired height of the exported layout obj only if
            it's a Plot instance. Otherwise the height kwarg is ignored.

        scale_factor (float, optional) : A factor to scale the output PNG by,
            providing a higher resolution while maintaining element relative
            scales.

        webdriver (selenium.webdriver or playwright Browser/BrowserContext) :
            A browser instance to use for export. Accepts a Selenium
            ``WebDriver`` or a Playwright ``Browser`` / ``BrowserContext``
            (e.g. from ``playwright.chromium.launch()`` or
            ``launch_persistent_context()``). The backend is auto-detected
            from the type of object passed.

        timeout (int) : the maximum amount of time (in seconds) to wait for
            Bokeh to initialize (default: 5) (Added in 1.1.1).

        state (State, optional) :
            A :class:`State` object. If None, then the current default
            implicit state is used. (default: None).

        backend (ExportBackendType, optional) :
            Which browser backend to use for export. If None, uses the
            ``BOKEH_EXPORT_BACKEND`` setting (default: auto-detect).
            Passing a ``webdriver`` instance overrides this setting.

    Returns:
        str : the filename where the static file is saved.

    If you would like to access an Image object directly, rather than save a
    file to disk, use the lower-level :func:`~bokeh.io.export.get_screenshot_as_png`
    function.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    '''
    image = get_screenshot_as_png(obj, width=width, height=height, scale_factor=scale_factor, driver=webdriver,
                                  timeout=timeout, state=state, backend=backend)

    if filename is None:
        filename = default_filename("png")

    if image.width == 0 or image.height == 0:
        raise ValueError("unable to save an empty image")

    filename = os.fspath(filename) # XXX: Image.save() doesn't fully support PathLike
    image.save(filename)

    return abspath(expanduser(filename))

def export_svg(obj: UIElement | Document, *, filename: PathLike | None = None, width: int | None = None,
        height: int | None = None, webdriver: DriverLike | None = None, timeout: int = 5,
        state: State | None = None, backend: ExportBackendType | None = None) -> list[str]:
    ''' Export a layout as SVG file or a document as a set of SVG files.

    If the filename is not given, it is derived from the script name
    (e.g. ``/foo/myplot.py`` will create ``/foo/myplot.svg``)

    Args:
        obj (UIElement object) : a Layout (Row/Column), Plot or Widget object to display

        filename (PathLike, e.g. str, Path, optional) : filename to save document under (default: None)
            If None, infer from the filename.

        width (int) : the desired width of the exported layout obj only if
            it's a Plot instance. Otherwise the width kwarg is ignored.

        height (int) : the desired height of the exported layout obj only if
            it's a Plot instance. Otherwise the height kwarg is ignored.

        webdriver (selenium.webdriver) : a selenium webdriver instance to use
            to export the image.

        timeout (int) : the maximum amount of time (in seconds) to wait for
            Bokeh to initialize (default: 5)

        state (State, optional) :
            A :class:`State` object. If None, then the current default
            implicit state is used. (default: None).

        backend (ExportBackendType, optional) :
            Which browser backend to use for export. If None, uses the
            ``BOKEH_EXPORT_BACKEND`` setting (default: auto-detect).
            Passing a ``webdriver`` instance forces the Selenium backend.

    Returns:
        list[str] : the list of filenames where the SVGs files are saved.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    '''
    svgs = get_svg(obj, width=width, height=height, driver=webdriver, timeout=timeout, state=state, backend=backend)
    return _write_collection(svgs, filename, "svg")

def export_svgs(obj: UIElement | Document, *, filename: str | None = None, width: int | None = None,
        height: int | None = None, webdriver: DriverLike | None = None, timeout: int = 5,
        state: State | None = None, backend: ExportBackendType | None = None) -> list[str]:
    ''' Export the SVG-enabled plots within a layout. Each plot will result
    in a distinct SVG file.

    If the filename is not given, it is derived from the script name
    (e.g. ``/foo/myplot.py`` will create ``/foo/myplot.svg``)

    Args:
        obj (UIElement object) : a Layout (Row/Column), Plot or Widget object to display

        filename (str, optional) : filename to save document under (default: None)
            If None, infer from the filename.

        width (int) : the desired width of the exported layout obj only if
            it's a Plot instance. Otherwise the width kwarg is ignored.

        height (int) : the desired height of the exported layout obj only if
            it's a Plot instance. Otherwise the height kwarg is ignored.

        webdriver (selenium.webdriver) : a selenium webdriver instance to use
            to export the image.

        timeout (int) : the maximum amount of time (in seconds) to wait for
            Bokeh to initialize (default: 5) (Added in 1.1.1).

        state (State, optional) :
            A :class:`State` object. If None, then the current default
            implicit state is used. (default: None).

        backend (ExportBackendType, optional) :
            Which browser backend to use for export. If None, uses the
            ``BOKEH_EXPORT_BACKEND`` setting (default: auto-detect).
            Passing a ``webdriver`` instance forces the Selenium backend.

    Returns:
        filenames (list(str)) : the list of filenames where the SVGs files are saved.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    '''
    svgs = get_svgs(obj, width=width, height=height, driver=webdriver, timeout=timeout, state=state, backend=backend)

    if len(svgs) == 0:
        log.warning("No SVG Plots were found.")
        return []

    return _write_collection(svgs, filename, "svg")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def _is_playwright_browser(obj: object) -> bool:
    '''Return True if ``obj`` is a Playwright Browser or BrowserContext.

    If Playwright is not installed, the object cannot be one of its types,
    so this unconditionally returns False. Otherwise a proper ``isinstance``
    check is performed.
    '''
    sync_api = import_optional("playwright.sync_api")
    if sync_api is None:
        return False
    return isinstance(obj, (sync_api.Browser, sync_api.BrowserContext))


def _resolve_backend(driver: DriverLike | None, backend: ExportBackendType | None) -> ModuleType:
    '''Determine which browser backend module to use.

    Returns the backend module itself (``bokeh.io.browser`` for playwright or
    ``bokeh.io.webdriver`` for selenium) so callers can dispatch directly
    without having to branch on a string.

    Priority order:
    1. If a Playwright ``Browser`` or ``BrowserContext`` is passed as
       *driver*, always use the playwright backend.
    2. If any other (Selenium) ``driver`` is passed, always use the
       selenium backend.
    3. If ``backend`` is explicitly specified, use that.
    4. Fall back to the ``BOKEH_EXPORT_BACKEND`` setting.
    5. If set to "auto" (default), try selenium first, then playwright.
       This preserves existing behaviour for users who already have
       selenium installed.
    '''
    if driver is not None:
        if _is_playwright_browser(driver):
            return _playwright_backend
        return _selenium_backend

    if backend is not None:
        if backend == "playwright":
            return _playwright_backend
        if backend == "selenium":
            return _selenium_backend
        raise ValueError(f"Invalid export backend: {backend!r}. Must be 'selenium' or 'playwright'.")

    configured = settings.export_backend()

    if configured == "playwright":
        return _playwright_backend
    if configured == "selenium":
        return _selenium_backend

    # "auto" — try selenium first (preserves existing behaviour), then playwright
    if import_optional("selenium") is not None:
        return _selenium_backend
    if import_optional("playwright") is not None:
        return _playwright_backend

    raise RuntimeError(
        "Neither Selenium nor Playwright is installed. Install one of:\n"
        "  pip install playwright && playwright install chromium\n"
        "  pip install selenium  (+ browser driver on PATH)",
    )


def get_screenshot_as_png(obj: UIElement | Document, *, driver: DriverLike | None = None, timeout: int = 5,
        resources: Resources = INLINE, width: int | None = None, height: int | None = None,
        scale_factor: float = 1, state: State | None = None, backend: ExportBackendType | None = None) -> Image.Image:
    ''' Get a screenshot of a ``UIElement`` object.

    Args:
        obj (UIElement or Document) : a Layout (Row/Column), Plot or Widget
            object or Document to export.

        driver (selenium.webdriver or playwright Browser/BrowserContext) :
            A browser instance to use for export. The backend is
            auto-detected from the type of object passed.

        timeout (int) : the maximum amount of time to wait for initialization.
            It will be used as a timeout for loading Bokeh, then when waiting for
            the layout to be rendered.

        scale_factor (float, optional) : A factor to scale the output PNG by,
            providing a higher resolution while maintaining element relative
            scales.

        state (State, optional) :
            A :class:`State` object. If None, then the current default
            implicit state is used. (default: None).

        backend ("selenium" or "playwright", optional) :
            Which browser backend to use. If None, auto-detected.
            Passing a ``driver`` overrides this setting.

    Returns:
        PIL.Image.Image : a pillow image loaded from PNG.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    '''
    backend_module = _resolve_backend(driver, backend)
    return backend_module.get_screenshot_as_png(
        obj, driver=driver, timeout=timeout, resources=resources,
        width=width, height=height, scale_factor=scale_factor, state=state,
    )

def get_svg(obj: UIElement | Document, *, driver: DriverLike | None = None, timeout: int = 5,
        resources: Resources = INLINE, width: int | None = None, height: int | None = None,
        state: State | None = None, backend: ExportBackendType | None = None) -> list[str]:
    backend_module = _resolve_backend(driver, backend)
    return backend_module.get_svg(
        obj, driver=driver, timeout=timeout, resources=resources,
        width=width, height=height, state=state,
    )

def get_svgs(obj: UIElement | Document, *, driver: DriverLike | None = None, timeout: int = 5,
        resources: Resources = INLINE, width: int | None = None, height: int | None = None,
        state: State | None = None, backend: ExportBackendType | None = None) -> list[str]:
    backend_module = _resolve_backend(driver, backend)
    return backend_module.get_svgs(
        obj, driver=driver, timeout=timeout, resources=resources,
        width=width, height=height, state=state,
    )

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _write_collection(items: list[str], filename: PathLike | None, ext: str) -> list[str]:
    if filename is None:
        filename = default_filename(ext)
    filename = os.fspath(filename)

    filenames: list[str] = []

    def _indexed(name: str, i: int) -> str:
        basename, ext = splitext(name)
        return f"{basename}_{i}{ext}"

    for i, item in enumerate(items):
        fname = filename if i == 0 else _indexed(filename, i)

        with open(fname, mode="w", encoding="utf-8") as f:
            f.write(item)

        filenames.append(fname)

    return filenames

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
