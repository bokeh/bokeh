from selenium.webdriver.firefox.service import Service

from ..remote.webdriver import WebDriver as RemoteWebDriver
from .options import Options

class WebDriver(RemoteWebDriver):
    def __init__(self,
        service: Service | None = ...,
        options: Options | None = ...,
    ) -> None: ...
