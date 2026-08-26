from bokeh.core.properties import AnyRef, Dict, List, String
from bokeh.models import IndexedDataSource


class RecordDataSource(IndexedDataSource):
    """A data source backed by records with nested values instead of columns."""

    __implementation__ = "record_data_source.ts"

    records = List(Dict(String, AnyRef), default=[])
