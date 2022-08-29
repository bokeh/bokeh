from typing import NamedTuple

class pmem(NamedTuple):
    rss: int
    vms: int
    shared: int
    text: int
    lib: int
    data: int
    dirty: int

class Process:
    def __init__(self, pid: int | None = ...) -> None: ...

    def memory_info(self) -> pmem: ...
