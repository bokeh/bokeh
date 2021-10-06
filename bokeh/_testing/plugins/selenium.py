#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define a Pytest plugin for a log file fixture

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
from typing import (
    TYPE_CHECKING,
    Callable,
    Iterator,
    List,
    NoReturn,
    Sequence,
)
from warnings import warn

# External imports
import pytest

if TYPE_CHECKING:
    import py
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

def pytest_report_collectionfinish(config: config.Config, startdir: py.path.local, items: Sequence[nodes.Item]) -> List[str]:
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
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.webdriver import WebDriver as Chrome
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--window-size=1920x1080")
        return Chrome(options=options)

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
def has_no_console_errors(pytestconfig: config.Config) -> Callable[[WebDriver], bool | NoReturn]:
    ''' Provide a function to assert no browser console errors are present.

    Unfortunately logs are only accessibly with Chrome web driver, see e.g.

        https://github.com/mozilla/geckodriver/issues/284

    For non-Chrome webdrivers this check always returns True.

    '''
    driver_name: str = pytestconfig.getoption('driver').lower()

    if driver_name == "chrome":

        def func(driver: WebDriver) -> bool | NoReturn:
            logs = driver.get_log('browser')
            severe_errors = [x for x in logs if x.get('level') == 'SEVERE']
            non_network_errors = [l for l in severe_errors if l.get('type') != 'network']

            if len(non_network_errors) == 0:
                if len(severe_errors) != 0:
                    warn(f"There were severe network errors (this may or may not have affected your test): {severe_errors}")
                return True

            # XXX: no return should be needed with NoReturn type (type-checker bug?)
            return pytest.fail(f"Console errors: {non_network_errors}")

    else:
        def func(driver: WebDriver) -> bool | NoReturn:
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
