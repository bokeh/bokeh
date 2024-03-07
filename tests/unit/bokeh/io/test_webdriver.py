#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import os

# External imports
import selenium.webdriver.chrome.webdriver
import selenium.webdriver.firefox.webdriver
from selenium.common.exceptions import WebDriverException

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
def test_create_firefox_webdriver() -> None:
    d = biw.create_firefox_webdriver()
    try:
        assert isinstance(d, selenium.webdriver.firefox.webdriver.WebDriver)
    finally:
        d.quit()

@pytest.mark.selenium
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

@pytest.mark.selenium
class Test_webdriver_control:

    def test_default(self) -> None:
        # other tests may have interacted with the global biw.webdriver_control,
        # so create a new instance only to check default values
        wc = biw._WebdriverState()
        assert wc.reuse is True
        assert wc.kind is None
        assert wc.current is None

    def test_get_with_reuse(self) -> None:
        biw.webdriver_control.reuse = True
        assert biw.webdriver_control.reuse is True
        d1 = biw.webdriver_control.get()
        d2 = biw.webdriver_control.get()
        assert d1 is d2
        biw.webdriver_control.reset()

    def test_get_with_reuse_and_reset(self) -> None:
        biw.webdriver_control.reuse = True
        assert biw.webdriver_control.reuse is True
        d1 = biw.webdriver_control.get()
        biw.webdriver_control.reset()
        d2 = biw.webdriver_control.get()
        assert d1 is not d2
        d3 = biw.webdriver_control.get()
        assert d2 is d3
        biw.webdriver_control.reset()

    def test_get_without_reuse(self) -> None:
        biw.webdriver_control.reuse = False
        assert biw.webdriver_control.reuse is False
        d1 = biw.webdriver_control.get()
        d2 = biw.webdriver_control.get()
        assert d1 is not d2
        biw.webdriver_control.reuse = True
        biw.webdriver_control.reset()

    @pytest.mark.parametrize('kind', ['firefox', 'chromium'])
    def test_create(self, kind: biw.DriverKind) -> None:
        biw.webdriver_control.kind = kind
        assert biw.webdriver_control.kind == kind
        d = biw.webdriver_control.create()
        assert isinstance(d, _driver_map[kind])
        biw.webdriver_control.reset()

    @pytest.mark.skipif(os.getenv("BOKEH_IN_DOCKER") != "1", reason="Not running in Docker")
    def test_create_chromium_without_docker_envvar(self) -> None:
        os.environ["BOKEH_IN_DOCKER"] = "0"
        biw.webdriver_control.kind = 'chromium'
        with pytest.raises(WebDriverException):
            biw.webdriver_control.create()
        # Reset envvar before continuing.
        os.environ["BOKEH_IN_DOCKER"] = "1"

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
