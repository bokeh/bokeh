from typing import Any, Literal, TypedDict

from typing_extensions import TypeAlias

from ..common.by import _ByType
from .webelement import WebElement

LogType: TypeAlias = Literal["browser", "driver", "client", "server"]

LogLevel: TypeAlias = Literal["WARNING", "ERROR", "SEVERE"]

class LogEntry(TypedDict):
    message: str
    level: LogLevel

class WebDriver:
    def get(self, url: str) -> None: ...

    def maximize_window(self) -> None: ...

    def get_screenshot_as_png(self) -> bytes: ...

    def execute_script(self, script: str, *args: Any) -> Any: ...

    def get_log(self, log_type: LogType) -> list[LogEntry]: ...

    def set_window_size(self, width: int, height: int) -> None: ...

    def quit(self) -> None: ...

    def implicitly_wait(self, time_to_wait: int) -> None: ...

    def find_element(self, by: _ByType, selector: str) -> WebElement: ...
    def find_elements(self, by: _ByType, selector: str) -> list[WebElement]: ...
