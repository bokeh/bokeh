#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define a Pytest plugin for selenium webdrivers.

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
import pathlib
from shutil import which
from typing import (
    TYPE_CHECKING,
    Callable,
    Iterator,
    Sequence,
)
from warnings import warn

# External imports
import pytest

if TYPE_CHECKING:
    from _pytest import config, nodes
    from selenium.webdriver.remote.webdriver import WebDriver

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'driver',
    'has_no_console_errors',
    'pytest_report_collectionfinish',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def pytest_report_collectionfinish(config: config.Config, start_path: pathlib.Path, items: Sequence[nodes.Item]) -> list[str]:
    '''

    '''
    driver_name: str = config.getoption('driver', 'chrome').lower()
    asserts = "ON" if driver_name == "chrome" else "OFF"
    return ["", f"Bokeh selenium tests using {driver_name!r} driver (no-console-error assertions: {asserts})"]

@pytest.fixture(scope="session")
def driver(pytestconfig: config.Config) -> Iterator[WebDriver]:
    ''' Select and configure a Selenium webdriver for integration tests.

    '''
    driver_name: str = pytestconfig.getoption('driver', 'chrome').lower()

    def chrome() -> WebDriver:
        for executable in ["chromedriver", "chromium.chromedriver", "chromedriver-binary"]:
            executable_path = which(executable)
            if executable_path is not None:
                break
        else:
            raise RuntimeError("chromedriver or its variant is not installed or not present on PATH")

        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        from selenium.webdriver.chrome.webdriver import WebDriver as Chrome

        service = Service(executable_path)
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--window-size=1920x1080")

        return Chrome(service=service, options=options)

    def firefox() -> WebDriver:
        from selenium.webdriver.firefox.options import Options
        from selenium.webdriver.firefox.webdriver import WebDriver as Firefox
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--window-size=1920x1080")
        return Firefox(options=options)

    def safari() -> WebDriver:
        from selenium.webdriver.safari.webdriver import WebDriver as Safari
        return Safari()

    driver: WebDriver
    if driver_name == "chrome":
        driver = chrome()
    elif driver_name == "firefox":
        driver = firefox()
    elif driver_name == "safari":
        driver = safari()
    else:
        raise ValueError("expected 'chrome', 'firefox' or 'safari'")

    driver.implicitly_wait(10)
    yield driver
    driver.quit()

@pytest.fixture(scope="session")
def has_no_console_errors(pytestconfig: config.Config) -> Callable[[WebDriver], bool]:
    ''' Provide a function to assert no browser console errors are present.

    Unfortunately logs are only accessibly with Chrome web driver, see e.g.

        https://github.com/mozilla/geckodriver/issues/284

    For non-Chrome webdrivers this check always returns True.

    '''
    driver_name: str = pytestconfig.getoption('driver').lower()

    if driver_name == "chrome":

        def func(driver: WebDriver) -> bool:
            logs = driver.get_log('browser')
            severe_errors = [x for x in logs if x.get('level') == 'SEVERE']
            non_network_errors = [l for l in severe_errors if l.get('type') != 'network']

            if len(non_network_errors) == 0:
                if len(severe_errors) != 0:
                    warn(f"There were severe network errors (this may or may not have affected your test): {severe_errors}")
                return True

            pytest.fail(f"Console errors: {non_network_errors}")

    else:
        def func(driver: WebDriver) -> bool:
            return True

    return func

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
