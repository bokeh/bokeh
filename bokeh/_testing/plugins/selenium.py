#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define a Pytest plugin for a log file fixture

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from warnings import warn

# External imports
import pytest
from selenium import webdriver

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def pytest_report_collectionfinish(config, startdir, items):
    '''

    '''
    driver  = config.getoption('driver', 'chrome').lower()
    asserts = "ON" if driver == "chrome" else "OFF"
    return ["", "Bokeh selenium tests using %r driver (no-console-error assertions: %s)" % (driver, asserts)]

@pytest.yield_fixture(scope="session")
def driver(pytestconfig):
    ''' Select and configure a Selenium webdriver for integration tests.

    '''
    driver_name  = pytestconfig.getoption('driver', 'chrome').lower()

    if driver_name == "chrome":
        from selenium.webdriver.chrome.options import Options
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--window-size=1920x1080")
        driver = webdriver.Chrome(chrome_options=options)

    elif driver_name == "firefox":
        from selenium.webdriver.firefox.options import Options
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--window-size=1920x1080")
        driver = webdriver.Firefox(firefox_options=options)

    elif driver_name == "safari":
        driver = webdriver.Safari()

    driver.implicitly_wait(10)

    yield driver

    driver.quit()

@pytest.fixture(scope="session")
def has_no_console_errors(pytestconfig):
    ''' Provide a function to assert no browser console errors are present.

    Unfortunately logs are only accessibly with Chrome web driver, see e.g.

        https://github.com/mozilla/geckodriver/issues/284

    For non-Chrome webdrivers this check always returns True.

    '''
    driver_name  = pytestconfig.getoption('driver').lower()

    if driver_name == "chrome":

        def func(driver):
            logs = driver.get_log('browser')
            severe_errors = [x for x in logs if x.get('level') == 'SEVERE']
            non_network_errors = [l for l in severe_errors if l.get('type') != 'network']

            if len(non_network_errors) == 0:
                if len(severe_errors) != 0:
                    warn("There were severe network errors (this may or may not have affected your test): %s" % severe_errors)
                return True

            pytest.fail('Console errors: %s' % non_network_errors)


    else:
        def func(driver):
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
