from typing import Any, List
from typing_extensions import Literal, TypedDict

LogType = Literal["browser", "driver", "client", "server"]

LogLevel = Literal["WARNING", "ERROR", "SEVERE"]

class LogEntry(TypedDict):
    message: str
    level: LogLevel

class WebDriver:
    def get(self, url: str) -> None: ...

    def maximize_window(self) -> None: ...

    def get_screenshot_as_png(self) -> bytes: ...

    def execute_script(self, script: str, *args: Any) -> Any: ...

    def get_log(self, log_type: LogType) -> List[LogEntry]: ...

    def set_window_size(self, width: int, height: int) -> None: ...

    def quit(self) -> None: ...
