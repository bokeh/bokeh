from typing import List, Tuple, overload
from typing_extensions import Literal

class HistoryAccessorBase:
    @overload
    def get_tail(self, n: int = ..., raw: bool = ..., # output: Literal[False] = ..., # XXX: mypy bug?
        include_latest: bool = ...) -> List[Tuple[int, int, str]]: ...
    @overload
    def get_tail(self, n: int = ..., raw: bool = ..., output: Literal[True] = ...,
        include_latest: bool = ...) -> List[Tuple[int, int, Tuple[str, str | None]]]: ...
