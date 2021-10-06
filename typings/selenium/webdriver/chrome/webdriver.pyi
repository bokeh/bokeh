from ..remote.webdriver import WebDriver as RemoteWebDriver
from .options import Options

class WebDriver(RemoteWebDriver):
    def __init__(self, options: Options | None = ...) -> None: ...
