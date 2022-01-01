#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2022, Anaconda, Inc., and Bokeh Contributors.
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

from ..util.dependencies import import_required # isort:skip
import_required("selenium.webdriver",
                "To use bokeh.io image export functions you need selenium "
                "('conda install selenium' or 'pip install selenium')")

# Standard library imports
import atexit
import os
from os.path import (
    devnull,
    dirname,
    isfile,
    join,
)
from shutil import which
from typing import List, Set

# External imports
from selenium import webdriver
from selenium.webdriver.remote.webdriver import WebDriver
from typing_extensions import Literal

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

DriverKind = Literal["firefox", "chromium"]

__all__ = (
    'webdriver_control',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def create_firefox_webdriver() -> WebDriver:
    firefox = which("firefox")
    if firefox is None:
        raise RuntimeError("firefox is not installed or not present on PATH")

    geckodriver = which("geckodriver")
    if geckodriver is None:
        raise RuntimeError("geckodriver is not installed or not present on PATH")

    firefox_paths = [
        join(dirname(firefox), "FirefoxApp", "firefox"),
        join(dirname(firefox), "FirefoxApp", "Contents", "MacOS", "firefox"),
    ]

    for firefox_path in firefox_paths:
        if _is_executable(firefox_path):
            binary_path = firefox_path
            break
    else:
        binary_path = firefox

    from selenium.webdriver.firefox.firefox_binary import FirefoxBinary  # type: ignore [import]
    binary = FirefoxBinary(binary_path)

    options = webdriver.firefox.options.Options()
    options.add_argument("--headless")

    return webdriver.Firefox(  # type: ignore [attr-defined]
        options=options,
        firefox_binary=binary,
        executable_path=geckodriver,
        service_log_path=devnull,
    )

def create_chromium_webdriver(extra_options: List[str] | None = None) -> WebDriver:
    options = webdriver.chrome.options.Options()
    options.add_argument("--headless")
    options.add_argument("--hide-scrollbars")
    options.add_argument("--force-device-scale-factor=1")
    options.add_argument("--force-color-profile=srgb")
    if extra_options:
        for op in extra_options:
            options.add_argument(op)
    return webdriver.Chrome(options=options)  # type: ignore [attr-defined]

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _is_executable(path: str) -> bool:
    return isfile(path) and os.access(path, os.X_OK)

def _try_create_firefox_webdriver() -> WebDriver | None:
    try:
        return create_firefox_webdriver()
    except Exception:
        return None

def _try_create_chromium_webdriver() -> WebDriver | None:
    try:
        return create_chromium_webdriver()
    except Exception:
        return None

class _WebdriverState:

    reuse: bool
    kind: DriverKind | None

    current: WebDriver | None
    _drivers: Set[WebDriver]

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

    def get(self) -> WebDriver:
        if not self.reuse or self.current is None:
            self.reset()
            self.current = self.create()
        return self.current

    def create(self, kind: DriverKind | None = None) -> WebDriver:
        driver = self._create(kind)
        self._drivers.add(driver)
        return driver

    def _create(self, kind: DriverKind | None) -> WebDriver:
        driver_kind = kind or self.kind

        if driver_kind is None:
            driver = _try_create_chromium_webdriver()
            if driver is not None:
                self.kind = "chromium"
                return driver

            driver = _try_create_firefox_webdriver()
            if driver is not None:
                self.kind = "firefox"
                return driver

            raise RuntimeError("Neither firefox and geckodriver nor a variant of chromium browser and " \
                               "chromedriver are available on system PATH. You can install the former " \
                               "with 'conda install -c conda-forge firefox geckodriver'.")
        elif driver_kind == "chromium":
            return create_chromium_webdriver()
        elif driver_kind == "firefox":
            return create_firefox_webdriver()
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
