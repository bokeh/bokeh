from typing import Any, Dict, Sequence

class Comm:

    def send(self, data: str | None = ..., metadata: Dict[str, Any] | None = ..., buffers: Sequence[bytes] | None = ...) -> None: ...
