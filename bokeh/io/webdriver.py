#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
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
import shutil
from os.path import devnull
from typing import List, Optional

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
    from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
    binary = FirefoxBinary(_detect("firefox"))
    options = webdriver.firefox.options.Options()
    options.add_argument("--headless")
    return webdriver.Firefox(firefox_binary=binary, options=options, service_log_path=devnull)

def create_chromium_webdriver() -> WebDriver:
    options = webdriver.chrome.options.Options()
    options.add_argument("--headless")
    options.add_argument("--hide-scrollbars")
    options.add_argument("--force-device-scale-factor=1")
    options.add_argument("--force-color-profile=srgb")
    return webdriver.Chrome(options=options)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _detect(executable: str) -> Optional[str]:
    return shutil.which(executable)

def _try_create_firefox_webdriver() -> Optional[WebDriver]:
    try:
        return create_firefox_webdriver()
    except Exception:
        return None

def _try_create_chromium_webdriver() -> Optional[WebDriver]:
    try:
        return create_chromium_webdriver()
    except Exception:
        return None

class _WebdriverState(object):
    '''

    '''

    reuse: bool
    kind: Optional[DriverKind]

    current: Optional[WebDriver]
    _drivers: List[WebDriver]

    def __init__(self, *, kind: Optional[DriverKind] = None, reuse: bool = True):
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

    def create(self, kind: Optional[DriverKind] = None) -> WebDriver:
        driver = self._create(kind)
        self._drivers.add(driver)
        return driver

    def _create(self, kind: Optional[DriverKind]) -> WebDriver:
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
