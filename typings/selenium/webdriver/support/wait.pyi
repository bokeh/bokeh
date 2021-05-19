from typing import Callable, Sequence, Type, TypeVar

from ..remote.webdriver import WebDriver

T = TypeVar("T")

class WebDriverWait:
    def __init__(self, driver: WebDriver, timeout: int, poll_frequency: float = ..., ignored_exceptions: Sequence[Type[Exception]] | None = ...) -> None: ...

    def until(self, method: Callable[[WebDriver], T], message: str = ...) -> T: ...
