from collections.abc import Callable, Sequence

from ..remote.webdriver import WebDriver

class WebDriverWait:
    def __init__(self, driver: WebDriver, timeout: int, poll_frequency: float = ..., ignored_exceptions: Sequence[type[Exception]] | None = ...) -> None: ...

    def until[T](self, method: Callable[[WebDriver], T], message: str = ...) -> T: ...
