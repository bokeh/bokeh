from collections.abc import Sequence
from typing import Any

class Comm:
    def __init__(self, target_name: str = ..., data: Any = ..., metadata: dict[str, Any] | None = ..., buffers: Sequence[bytes] | None = ...) -> None: ...

    def send(self, data: Any = ..., metadata: dict[str, Any] | None = ..., buffers: Sequence[bytes] | None = ...) -> None: ...
