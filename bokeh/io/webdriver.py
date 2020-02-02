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

# Standard library imports
import atexit
import shutil
from os.path import devnull
from subprocess import PIPE, Popen
from typing import Any, Optional

# External imports
from typing_extensions import Literal

# Bokeh imports
from ..util.dependencies import import_required

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

webdriver = import_required('selenium.webdriver',
                            'To use bokeh.io image export functions you need selenium ' +
                            '("conda install selenium" or "pip install selenium")')

DriverKind = Literal["firefox", "chromium"]

WebDriver = Any

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
    options = webdriver.firefox.options.Options()
    options.add_argument("--headless")
    return webdriver.Firefox(options=options, service_log_path=devnull)

def create_chromium_webdriver() -> WebDriver:
    options = webdriver.chrome.options.Options()
    options.add_argument("--headless")
    options.add_argument("--hide-scrollbars")
    return webdriver.Chrome(options=options)

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def _detect(executable: str) -> Optional[str]:
    path = shutil.which(executable)
    if path is None:
        return None

    try:
        proc = Popen([path, "--version"], stdout=PIPE, stderr=PIPE)
        (stdout, stderr) = proc.communicate()
        if proc.returncode != 0:
            return None
    except OSError:
        return None

    return path

def _is_available(executable: str) -> bool:
    return _detect(executable) is not None

def _has_firefox() -> bool:
    names = ["firefox-bin", "firefox"]
    return any(_is_available(name) for name in names) and _is_available("geckodriver")

def _has_chromium() -> bool:
    names = ["chromium-browser", "chromium", "chrome", "google-chrome", "Google Chrome"]
    return any(_is_available(name) for name in names) and _is_available("chromedriver")

class _WebdriverState(object):
    '''

    '''

    _reuse: bool
    _kind: DriverKind

    current: Optional[WebDriver]

    def __init__(self, *, reuse: bool = True, kind: Optional[DriverKind] = None):
        self.reuse = reuse
        self.current = None

        if kind is not None:
            self.kind = kind
        else:
            if _has_chromium():
                self.kind = "chromium"
            elif _has_firefox():
                self.kind = "firefox"
            else:
                raise RuntimeError("Neither firefox/geckodriver nor chromium-browser/chromedriver are available on system PATH. " \
                                   "You can install the former with 'conda install -c conda-forge firefox geckodriver'.")

    @staticmethod
    def terminate(driver: WebDriver) -> None:
        driver.quit()

    def reset(self) -> None:
        if self.current is not None:
            self.terminate(self.current)
            self.current = None

    def get(self) -> WebDriver:
        if not self.reuse or self.current is None:
            if self.current is not None:
                self.terminate(self.current)
            self.current = self.create()
        return self.current

    def create(self, kind: Optional[DriverKind] = None) -> WebDriver:
        driver_kind = kind or self.kind
        if driver_kind == "firefox":
            return create_firefox_webdriver()
        elif driver_kind == "chromium":
            return create_chromium_webdriver()
        else:
            raise ValueError(f"Unknown webdriver kind {driver_kind}")

    @property
    def reuse(self) -> bool:
        return self._reuse

    @reuse.setter
    def reuse(self, value: bool) -> None:
        self._reuse = value

    @property
    def kind(self) -> DriverKind:
        return self._kind

    @kind.setter
    def kind(self, value: DriverKind) -> None:
        self._kind = value

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

webdriver_control = _WebdriverState()

atexit.register(lambda: webdriver_control.reset())
