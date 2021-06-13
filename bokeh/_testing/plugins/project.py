#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2021, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Define a Pytest plugin for a Bokeh-specific testing tools

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
import socket
import time
from contextlib import closing
from threading import Thread
from typing import (
    TYPE_CHECKING,
    Any,
    Callable,
    Dict,
    Tuple,
)

# External imports
import pytest
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait
from tornado.ioloop import IOLoop
from tornado.web import RequestHandler
from typing_extensions import Protocol

if TYPE_CHECKING:
    from selenium.webdriver.common.keys import _KeySeq
    from selenium.webdriver.remote.webdriver import WebDriver
    from selenium.webdriver.remote.webelement import WebElement

# Bokeh imports
import bokeh.server.views.ws as ws
from bokeh._testing.util.selenium import INIT, RESULTS, wait_for_canvas_resize
from bokeh.io import save
from bokeh.server.server import Server

if TYPE_CHECKING:
    from bokeh._testing.plugins.file_server import SimpleWebServer
    from bokeh.application.handlers.function import ModifyDoc
    from bokeh.models.layouts import LayoutDOM

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

pytest_plugins = (
    "bokeh._testing.plugins.project",
    "bokeh._testing.plugins.file_server",
    "bokeh._testing.plugins.selenium",
)

__all__ = (
    'bokeh_app_info',
    'bokeh_model_page',
    'bokeh_server_page',
    'find_free_port',
    'output_file_url',
    'single_plot_page',
    'test_file_path_and_url',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@pytest.fixture
def output_file_url(request: pytest.FixtureRequest, file_server: SimpleWebServer) -> str:
    from bokeh.io import output_file
    filename = request.function.__name__ + '.html'
    file_obj = request.fspath.dirpath().join(filename)
    file_path = file_obj.strpath
    url = file_path.replace('\\', '/')  # Windows-proof

    output_file(file_path, mode='inline')

    def tear_down() -> None:
        if file_obj.isfile():
            file_obj.remove()
    request.addfinalizer(tear_down)

    return file_server.where_is(url)

@pytest.fixture
def test_file_path_and_url(request: pytest.FixtureRequest, file_server: SimpleWebServer) -> Tuple[str, str]:
    filename = request.function.__name__ + '.html'
    file_obj = request.fspath.dirpath().join(filename)
    file_path = file_obj.strpath
    url = file_path.replace('\\', '/')  # Windows-proof

    def tear_down() -> None:
        if file_obj.isfile():
            file_obj.remove()
    request.addfinalizer(tear_down)

    return file_path, file_server.where_is(url)


class _ExitHandler(RequestHandler):
    def initialize(self, io_loop: IOLoop) -> None:
        self.io_loop = io_loop
    async def get(self, *args: Any, **kwargs: Any) -> None:
        self.io_loop.stop()


def find_free_port() -> int:
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

class BokehAppInfo(Protocol):
    def __call__(self, modify_doc: ModifyDoc) -> Tuple[str, ws.MessageTestPort]: ...

class HasNoConsoleErrors(Protocol):
    def __call__(self, webdriver: WebDriver) -> bool: ...

@pytest.fixture
def bokeh_app_info(request: pytest.FixtureRequest, driver: WebDriver) -> BokehAppInfo:
    ''' Start a Bokeh server app and return information needed to test it.

    Returns a tuple (url, message_test_port), where the latter is an instance of
    ``MessageTestPort`` dataclass, and will contain all messages that the Bokeh
    Server sends/receives while running during the test.

    '''

    def func(modify_doc: ModifyDoc) -> Tuple[str, ws.MessageTestPort]:
        ws._message_test_port = ws.MessageTestPort(sent=[], received=[])
        port = find_free_port()
        def worker() -> None:
            io_loop = IOLoop()
            server = Server({'/': modify_doc},
                            port=port,
                            io_loop=io_loop,
                            extra_patterns=[('/exit', _ExitHandler, dict(io_loop=io_loop))])
            server.start()
            server.io_loop.start()

        t = Thread(target=worker)
        t.start()

        def cleanup() -> None:
            driver.get(f"http://localhost:{port}/exit")

            # XXX (bev) this line is a workaround for https://github.com/bokeh/bokeh/issues/7970
            # and should be removed when that issue is resolved
            driver.get_log('browser')

            ws._message_test_port = None
            t.join()

        request.addfinalizer(cleanup)

        return f"http://localhost:{port}/", ws._message_test_port

    return func

class _ElementMixin:
    _driver: WebDriver

    def click_element_at_position(self, element: WebElement, x: int, y: int) -> None:
        actions = ActionChains(self._driver)
        actions.move_to_element_with_offset(element, x, y)
        actions.click()
        actions.perform()

    def double_click_element_at_position(self, element: WebElement, x: int, y: int) -> None:
        actions = ActionChains(self._driver)
        actions.move_to_element_with_offset(element, x, y)
        actions.click()
        actions.click()
        actions.perform()

    def drag_element_at_position(self, element: WebElement, x: int, y: int, dx: int, dy: int, mod: _KeySeq | None = None) -> None:
        actions = ActionChains(self._driver)
        if mod:
            actions.key_down(mod)
        actions.move_to_element_with_offset(element, x, y)
        actions.click_and_hold()
        actions.move_by_offset(dx, dy)
        actions.release()
        if mod:
            actions.key_up(mod)
        actions.perform()

    def send_keys(self, *keys: _KeySeq) -> None:
        actions = ActionChains(self._driver)
        actions.send_keys(*keys)
        actions.perform()

class _CanvasMixin(_ElementMixin):
    canvas: WebElement

    def click_canvas_at_position(self, x: int, y: int) -> None:
        self.click_element_at_position(self.canvas, x, y)

    def double_click_canvas_at_position(self, x: int, y: int) -> None:
        self.double_click_element_at_position(self.canvas, x, y)

    def click_custom_action(self) -> None:
        button = self._driver.find_element_by_class_name("bk-toolbar-button-custom-action")
        button.click()

    def drag_canvas_at_position(self, x: int, y: int, dx: int, dy: int, mod: _KeySeq | None = None) -> None:
        self.drag_element_at_position(self.canvas, x, y, dx, dy, mod)

    def get_toolbar_button(self, name: str) -> WebElement:
        return self._driver.find_element_by_class_name(f"bk-tool-icon-{name}")

class _BokehPageMixin(_ElementMixin):

    test_div: WebElement
    _driver: WebDriver
    _has_no_console_errors: HasNoConsoleErrors

    @property
    def results(self) -> Dict[str, Any]:
        WebDriverWait(self._driver, 10).until(EC.staleness_of(self.test_div))
        self.test_div = self._driver.find_element_by_class_name("bokeh-test-div")
        return self._driver.execute_script(RESULTS)

    @property
    def driver(self) -> WebDriver:
        return self._driver

    def init_results(self) -> None:
        self._driver.execute_script(INIT)
        self.test_div = self._driver.find_element_by_class_name("bokeh-test-div")

    def has_no_console_errors(self) -> bool:
        return self._has_no_console_errors(self._driver)

class _BokehModelPage(_BokehPageMixin):

    def __init__(self, model: LayoutDOM, driver: WebDriver, output_file_url: str, has_no_console_errors: HasNoConsoleErrors) -> None:
        self._driver = driver
        self._model = model
        self._has_no_console_errors = has_no_console_errors

        save(self._model)
        self._driver.get(output_file_url)
        self.init_results()

@pytest.fixture()
def bokeh_model_page(driver: WebDriver, output_file_url: str,
        has_no_console_errors: HasNoConsoleErrors) -> Callable[[LayoutDOM], _BokehModelPage]:
    def func(model: LayoutDOM) -> _BokehModelPage:
        return _BokehModelPage(model, driver, output_file_url, has_no_console_errors)
    return func

class _SinglePlotPage(_BokehModelPage, _CanvasMixin):

    # model may be a layout, but should only contain a single plot
    def __init__(self, model: LayoutDOM, driver: WebDriver, output_file_url: str, has_no_console_errors: HasNoConsoleErrors) -> None:
        super().__init__(model, driver, output_file_url, has_no_console_errors)

        self.canvas = self._driver.find_element_by_tag_name('canvas')
        wait_for_canvas_resize(self.canvas, self._driver)

@pytest.fixture()
def single_plot_page(driver: WebDriver, output_file_url: str,
        has_no_console_errors: HasNoConsoleErrors) -> Callable[[LayoutDOM], _SinglePlotPage]:
    def func(model: LayoutDOM) -> _SinglePlotPage:
        return _SinglePlotPage(model, driver, output_file_url, has_no_console_errors)
    return func

class _BokehServerPage(_BokehPageMixin, _CanvasMixin):

    def __init__(self, modify_doc: ModifyDoc, driver: WebDriver, bokeh_app_info: BokehAppInfo, has_no_console_errors: HasNoConsoleErrors) -> None:
        self._driver = driver
        self._has_no_console_errors = has_no_console_errors

        self._app_url, self.message_test_port = bokeh_app_info(modify_doc)
        time.sleep(0.1)
        self._driver.get(self._app_url)

        self.init_results()

        self.canvas = self._driver.find_element_by_tag_name('canvas')
        wait_for_canvas_resize(self.canvas, self._driver)

@pytest.fixture()
def bokeh_server_page(driver: WebDriver, bokeh_app_info: BokehAppInfo,
        has_no_console_errors: HasNoConsoleErrors) -> Callable[[ModifyDoc], _BokehServerPage]:
    def func(modify_doc: ModifyDoc) -> _BokehServerPage:
        return _BokehServerPage(modify_doc, driver, bokeh_app_info, has_no_console_errors)
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
