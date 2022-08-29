# Standard library imports
from typing import IO, Any, Literal

from typing_extensions import TypeAlias

# XXX: this is incorrect
class PageElement:
    attrs: dict[str, Any]
    string: str | None

class ResultSet(list[PageElement]):
    ...

_Features: TypeAlias = Literal["lxml", "lxml-xml", "html.parser", "html5lib" "html", "html5", "xml"]

class BeautifulSoup:
    def __init__(self, markup: str | IO[str] = ..., features: _Features | None = ...) -> None: ...

    def find_all(self, name: str | None = ..., attrs: dict[str, Any] = ...,
        recursive: bool = ..., text: str | None = ..., limit: int | None = ..., **kwargs: Any) -> ResultSet: ...
