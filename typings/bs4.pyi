# Standard library imports
from typing import IO, Any, Dict, List

# External imports
from typing_extensions import Literal

# XXX: this is incorrect
class PageElement:
    attrs: Dict[str, Any]
    string: str | None

class ResultSet(List[PageElement]):
    ...

_Features = Literal["lxml", "lxml-xml", "html.parser", "html5lib" "html", "html5", "xml"]

class BeautifulSoup:
    def __init__(self, markup: str | IO[str] = ..., features: _Features | None = ...) -> None: ...

    def find_all(self, name: str | None = ..., attrs: Dict[str, Any] = ...,
        recursive: bool = ..., text: str | None = ..., limit: int | None = ..., **kwargs: Any) -> ResultSet: ...
