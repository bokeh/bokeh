#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# External imports
import selenium.webdriver.chrome.webdriver
import selenium.webdriver.firefox.webdriver
from flaky import flaky

# Module under test
import bokeh.io.webdriver as biw # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@pytest.mark.selenium
@flaky(max_runs=10)
def test_create_firefox_webdriver() -> None:
    d = biw.create_firefox_webdriver()
    try:
        assert isinstance(d, selenium.webdriver.firefox.webdriver.WebDriver)
    finally:
        d.quit()

@pytest.mark.selenium
@flaky(max_runs=10)
def test_create_chromium_webdriver() -> None:
    d = biw.create_chromium_webdriver()
    try:
        assert isinstance(d, selenium.webdriver.chrome.webdriver.WebDriver)
    finally:
        d.quit()

_driver_map = {
    "firefox": selenium.webdriver.firefox.webdriver.WebDriver,
    "chromium": selenium.webdriver.chrome.webdriver.WebDriver,
}

@flaky(max_runs=10)
class Test_webdriver_control:

    def test_default(self) -> None:
        # other tests may have interacted with the global biw.webdriver_control,
        # so create a new instance only to check default values
        wc = biw._WebdriverState()
        assert wc.reuse == True
        assert wc.kind == None
        assert wc.current is None

    def test_get_with_reuse(self) -> None:
        biw.webdriver_control.reuse = True
        assert biw.webdriver_control.reuse == True
        d1 = biw.webdriver_control.get()
        d2 = biw.webdriver_control.get()
        assert d1 is d2
        biw.webdriver_control.reset()

    def test_get_with_reuse_and_reset(self) -> None:
        biw.webdriver_control.reuse = True
        assert biw.webdriver_control.reuse == True
        d1 = biw.webdriver_control.get()
        biw.webdriver_control.reset()
        d2 = biw.webdriver_control.get()
        assert d1 is not d2
        d3 = biw.webdriver_control.get()
        assert d2 is d3
        biw.webdriver_control.reset()

    def test_get_without_reuse(self) -> None:
        biw.webdriver_control.reuse = False
        assert biw.webdriver_control.reuse == False
        d1 = biw.webdriver_control.get()
        d2 = biw.webdriver_control.get()
        assert d1 is not d2
        biw.webdriver_control.reuse = True
        biw.webdriver_control.reset()

    @pytest.mark.selenium
    @pytest.mark.parametrize('kind', ['firefox', 'chromium'])
    def test_create(self, kind) -> None:
        biw.webdriver_control.kind = kind
        assert biw.webdriver_control.kind == kind
        d = biw.webdriver_control.create()
        assert isinstance(d, _driver_map[kind])
        biw.webdriver_control.reset()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
