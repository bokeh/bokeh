from ..remote.webdriver import WebDriver as RemoteWebDriver
from .options import Options
from .service import Service

class WebDriver(RemoteWebDriver):
    def __init__(self, service: Service | None = ..., options: Options | None = ...) -> None: ...
