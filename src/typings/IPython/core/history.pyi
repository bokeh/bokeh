from typing import Literal, overload

class HistoryAccessorBase:
    @overload
    def get_tail(self, n: int = ..., raw: bool = ..., # output: Literal[False] = ..., # XXX: mypy bug?
        include_latest: bool = ...) -> list[tuple[int, int, str]]: ...
    @overload
    def get_tail(self, n: int = ..., raw: bool = ..., output: Literal[True] = ...,
        include_latest: bool = ...) -> list[tuple[int, int, tuple[str, str | None]]]: ...
