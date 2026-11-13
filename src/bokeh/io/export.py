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

import os
from os.path import abspath, expanduser, splitext
from typing import TYPE_CHECKING

from ..resources import INLINE
from . import browser
from .util import default_filename, get_layout_html

if TYPE_CHECKING:
    from PIL import Image

    try:
        from playwright.sync_api import Browser, BrowserContext
    except ImportError:
        from typing import (  # type: ignore[assignment]
            Any as Browser,
            Any as BrowserContext,
        )

    DriverLike = Browser | BrowserContext

    from ..core.types import PathLike
    from ..document import Document
    from ..models.ui import UIElement
    from ..resources import ResourcesLike

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

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
        timeout: int = 5) -> str:
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

        webdriver (playwright Browser or BrowserContext) :
            An optional Playwright browser or browser context to use for export.

        timeout (int) : the maximum amount of time (in seconds) to wait for
            Bokeh to initialize (default: 5) (Added in 1.1.1).

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
                                  timeout=timeout)

    if filename is None:
        filename = default_filename("png")

    if image.width == 0 or image.height == 0:
        raise ValueError("unable to save an empty image")

    filename = os.fspath(filename) # XXX: Image.save() doesn't fully support PathLike
    image.save(filename)

    return abspath(expanduser(filename))

def export_svg(obj: UIElement | Document, *, filename: PathLike | None = None, width: int | None = None,
        height: int | None = None, webdriver: DriverLike | None = None, timeout: int = 5) -> list[str]:
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

        webdriver (playwright Browser or BrowserContext) :
            An optional Playwright browser or browser context to use for export.

        timeout (int) : the maximum amount of time (in seconds) to wait for
            Bokeh to initialize (default: 5)

    Returns:
        list[str] : the list of filenames where the SVGs files are saved.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    '''
    svgs = get_svg(obj, width=width, height=height, driver=webdriver, timeout=timeout)
    return _write_collection(svgs, filename, "svg")

def export_svgs(obj: UIElement | Document, *, filename: str | None = None, width: int | None = None,
        height: int | None = None, webdriver: DriverLike | None = None, timeout: int = 5) -> list[str]:
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

        webdriver (playwright Browser or BrowserContext) :
            An optional Playwright browser or browser context to use for export.

        timeout (int) : the maximum amount of time (in seconds) to wait for
            Bokeh to initialize (default: 5) (Added in 1.1.1).

    Returns:
        filenames (list(str)) : the list of filenames where the SVGs files are saved.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    '''
    svgs = get_svgs(obj, width=width, height=height, driver=webdriver, timeout=timeout)

    if len(svgs) == 0:
        log.warning("No SVG Plots were found.")
        return []

    return _write_collection(svgs, filename, "svg")

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def get_screenshot_as_png(obj: UIElement | Document, *, driver: DriverLike | None = None, timeout: int = 5,
        resources: ResourcesLike = INLINE, width: int | None = None, height: int | None = None,
        scale_factor: float = 1) -> Image.Image:
    ''' Get a screenshot of a ``UIElement`` object.

    Args:
        obj (UIElement or Document) : a Layout (Row/Column), Plot or Widget
            object or Document to export.

        driver (playwright Browser or BrowserContext) :
            An optional Playwright browser or browser context to use for export.

        timeout (int) : the maximum amount of time to wait for initialization.
            It will be used as a timeout for loading Bokeh, then when waiting for
            the layout to be rendered.

        resources (Resources): information relating to loading or embedding Bokeh
            JavaScript and CSS, defaults to ``"inline"`` mode

        width (int) : the desired width of the exported layout.

        height (int) : the desired height of the exported layout.

        scale_factor (float, optional) : A factor to scale the output PNG by,
            providing a higher resolution while maintaining element relative
            scales.

    Returns:
        PIL.Image.Image : a pillow image loaded from PNG.

    .. warning::
        Responsive sizing_modes may generate layouts with unexpected size and
        aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

    '''
    return browser.get_screenshot_as_png(
        obj, driver=driver, timeout=timeout, resources=resources,
        width=width, height=height, scale_factor=scale_factor,
    )


def get_screenshot_as_png_from_html(html: str, *, driver: DriverLike | None = None, timeout: int = 5,
        scale_factor: float = 1) -> Image.Image:
    '''Capture a fully assembled Bokeh HTML document as one PNG image.

    Args:
        html:
            The complete HTML document to render.
        driver:
            An optional Playwright browser or browser context.
        timeout:
            Maximum time in seconds to wait for Bokeh rendering.
        scale_factor:
            The output image scale factor.

    Returns:
        The rendered PNG image.

    '''
    return browser.get_screenshot_as_png_from_html(
        html, driver=driver, timeout=timeout, scale_factor=scale_factor,
    )

def get_svg(obj: UIElement | Document, *, driver: DriverLike | None = None, timeout: int = 5,
        resources: ResourcesLike = INLINE, width: int | None = None, height: int | None = None) -> list[str]:
    return browser.get_svg(
        obj, driver=driver, timeout=timeout, resources=resources,
        width=width, height=height,
    )

def get_svgs(obj: UIElement | Document, *, driver: DriverLike | None = None, timeout: int = 5,
        resources: ResourcesLike = INLINE, width: int | None = None, height: int | None = None) -> list[str]:
    return browser.get_svgs(
        obj, driver=driver, timeout=timeout, resources=resources,
        width=width, height=height,
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
