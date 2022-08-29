from .history import HistoryAccessorBase

class InteractiveShell:
    history_manager: HistoryAccessorBase | None
