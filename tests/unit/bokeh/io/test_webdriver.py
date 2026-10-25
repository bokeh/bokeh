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

import pytest # isort:skip

if not pytest.importorskip("selenium"):
    pytest.skip('selenium not installed', allow_module_level=True)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

import os
import subprocess
import sys
import threading
from collections.abc import Iterator
from unittest.mock import Mock

import selenium.webdriver.chrome.webdriver
import selenium.webdriver.firefox.webdriver
from selenium.common.exceptions import WebDriverException

# Module under test
import bokeh.io.webdriver as biw # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

pytestmark = pytest.mark.xdist_group(name="webdriver")


@pytest.fixture(autouse=True)
def webdriver_state(monkeypatch: pytest.MonkeyPatch) -> Iterator[biw._WebdriverState]:
    state = biw._WebdriverState()
    monkeypatch.setattr(biw, "webdriver_control", state)
    try:
        yield state
    finally:
        state.cleanup()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

def test_log_console_skips_firefox() -> None:
    driver = Mock(capabilities={"browserName": "firefox"})
    driver.get_log.side_effect = WebDriverException("HTTP method not allowed")
    biw._log_console(driver)
    driver.get_log.assert_not_called()


def test_log_console_keeps_chromium_warnings(caplog: pytest.LogCaptureFixture) -> None:
    driver = Mock(capabilities={"browserName": "chrome"})
    driver.get_log.return_value = [
        {"level": "WARNING", "message": "render warning"},
        {"level": "INFO", "message": "informational message"},
    ]
    biw._log_console(driver)
    driver.get_log.assert_called_once_with("browser")
    assert "render warning" in caplog.text
    assert "informational message" not in caplog.text


@pytest.mark.selenium
def test_create_firefox_webdriver() -> None:
    d = biw.webdriver_control.create("firefox")
    assert isinstance(d, selenium.webdriver.firefox.webdriver.WebDriver)

@pytest.mark.selenium
def test_create_chromium_webdriver() -> None:
    d = biw.webdriver_control.create("chromium")
    assert isinstance(d, selenium.webdriver.chrome.webdriver.WebDriver)

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

def test_cleanup_all_drivers(webdriver_state: biw._WebdriverState, monkeypatch: pytest.MonkeyPatch) -> None:
    drivers = [Mock(), Mock(), Mock()]
    monkeypatch.setattr(webdriver_state, "_create", Mock(side_effect=drivers))
    current = webdriver_state.get()
    webdriver_state.create()
    webdriver_state.create()
    webdriver_state.cleanup()
    webdriver_state.cleanup()
    assert webdriver_state.current is None
    assert webdriver_state._drivers == set()
    assert webdriver_state._quitters == {}
    assert current is drivers[0]
    for driver in drivers:
        driver.quit.assert_called_once_with()
        driver.service.process.kill.assert_not_called()


def test_cleanup_continues_after_quit_error(webdriver_state: biw._WebdriverState, monkeypatch: pytest.MonkeyPatch) -> None:
    drivers = [Mock(), Mock()]
    for driver in drivers:
        driver.quit.side_effect = RuntimeError("quit failed")
    monkeypatch.setattr(webdriver_state, "_create", Mock(side_effect=drivers))
    webdriver_state.get()
    webdriver_state.create()
    webdriver_state.cleanup()
    assert webdriver_state.current is None
    assert not webdriver_state._drivers
    for driver in drivers:
        driver.quit.assert_called_once_with()


def test_terminate_stuck_quit(webdriver_state: biw._WebdriverState, monkeypatch: pytest.MonkeyPatch) -> None:
    release = threading.Event()
    driver = Mock()
    driver.quit.side_effect = release.wait
    driver.service.process.poll.return_value = None
    driver.service.process.kill.side_effect = release.set
    monkeypatch.setattr(webdriver_state, "_create", Mock(return_value=driver))
    monkeypatch.setattr(biw, "_WEBDRIVER_QUIT_TIMEOUT", 0.05)
    webdriver_state.get()
    try:
        webdriver_state.reset()
        assert webdriver_state.current is None
        assert not webdriver_state._drivers
        driver.service.process.kill.assert_called_once_with()
        driver.service.process.wait.assert_called_once_with(timeout=5)
    finally:
        release.set()


def test_terminate_clears_current_on_error(webdriver_state: biw._WebdriverState, monkeypatch: pytest.MonkeyPatch) -> None:
    driver = Mock()
    driver.quit.side_effect = RuntimeError("quit failed")
    monkeypatch.setattr(webdriver_state, "_create", Mock(return_value=driver))
    webdriver_state.get()
    with pytest.raises(RuntimeError, match="quit failed"):
        webdriver_state.reset()
    assert webdriver_state.current is None
    assert not webdriver_state._drivers
    webdriver_state.cleanup()


def test_stuck_quit_at_exit() -> None:
    # Exercise the real atexit callback in a separate interpreter. A non-daemon
    # quitter or a thread started inside atexit would fail this regression.
    code = """
import threading
from unittest.mock import Mock
import bokeh.io.webdriver as biw
biw._WEBDRIVER_QUIT_TIMEOUT = 0.05
driver = Mock()
driver.quit.side_effect = threading.Event().wait
driver.service.process.poll.return_value = None
driver.service.process.kill.side_effect = lambda: print('killed', flush=True)
biw.webdriver_control._create = lambda *args, **kwargs: driver
biw.webdriver_control.get()
"""
    result = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, timeout=15)
    assert result.returncode == 0, result.stderr
    assert "killed" in result.stdout
    assert "Exception ignored in atexit callback" not in result.stderr

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
