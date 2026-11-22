from typing import Any

from .history import HistoryAccessorBase

class InteractiveShell:
    events: Any
    history_manager: HistoryAccessorBase | None
