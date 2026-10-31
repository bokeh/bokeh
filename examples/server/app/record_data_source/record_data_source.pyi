from typing import Any

from bokeh.models import IndexedDataSource

class RecordDataSource(IndexedDataSource):
    def __init__(self, **kwargs: Any) -> None: ...

    records: list[dict[str, Any]] = ...
