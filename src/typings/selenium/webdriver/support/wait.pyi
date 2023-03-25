from collections.abc import Callable, Sequence
from typing import TypeVar

from ..remote.webdriver import WebDriver

_T = TypeVar("_T")

class WebDriverWait:
    def __init__(self, driver: WebDriver, timeout: int, poll_frequency: float = ..., ignored_exceptions: Sequence[type[Exception]] | None = ...) -> None: ...

    def until(self, method: Callable[[WebDriver], _T], message: str = ...) -> _T: ...
