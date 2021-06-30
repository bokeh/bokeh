from typing import Callable, Sequence, Type, TypeVar

from ..remote.webdriver import WebDriver

_T = TypeVar("_T")

class WebDriverWait:
    def __init__(self, driver: WebDriver, timeout: int, poll_frequency: float = ..., ignored_exceptions: Sequence[Type[Exception]] | None = ...) -> None: ...

    def until(self, method: Callable[[WebDriver], _T], message: str = ...) -> _T: ...
