from __future__ import annotations

# External imports
from ..remote.webdriver import WebDriver
from ..remote.webelement import WebElement
from .keys import _KeySeq

class ActionChains:
    def __init__(self, driver: WebDriver) -> None: ...
    def perform(self) -> None: ...
    def reset_actions(self) -> None: ...
    def click(self, on_element: WebElement | None = ...) -> ActionChains: ...
    def click_and_hold(self, on_element: WebElement | None = ...) -> ActionChains: ...
    def context_click(self, on_element: WebElement | None = ...) -> ActionChains: ...
    def double_click(self, on_element: WebElement | None = ...) -> ActionChains: ...
    def drag_and_drop(self, source: WebElement, target: WebElement) -> ActionChains: ...
    def drag_and_drop_by_offset(self, source: WebElement, xoffset: float, yoffset: float) -> ActionChains: ...
    def key_down(self, value: _KeySeq, element: WebElement | None = ...) -> ActionChains: ...
    def key_up(self, value: _KeySeq, element: WebElement | None = ...) -> ActionChains: ...
    def move_by_offset(self, xoffset: float, yoffset: float) -> ActionChains: ...
    def move_to_element(self, to_element: WebElement) -> ActionChains: ...
    def move_to_element_with_offset(self, to_element: WebElement, xoffset: float, yoffset: float) -> ActionChains: ...
    def pause(self, seconds: int) -> ActionChains: ...
    def release(self, on_element: WebElement | None = ...) -> ActionChains: ...
    def send_keys(self, *keys_to_send: _KeySeq) -> ActionChains: ...
    def send_keys_to_element(self, element: WebElement, *keys_to_send: _KeySeq) -> ActionChains: ...
