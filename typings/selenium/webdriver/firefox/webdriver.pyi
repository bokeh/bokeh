from ..remote.webdriver import WebDriver as RemoteWebDriver
from .firefox_binary import FirefoxBinary
from .options import Options

class WebDriver(RemoteWebDriver):
    def __init__(self,
        options: Options | None = ...,
        firefox_binary: FirefoxBinary | None = ...,
        executable_path: str | None = ...,
        service_log_path: str = ...,
    ) -> None: ...
