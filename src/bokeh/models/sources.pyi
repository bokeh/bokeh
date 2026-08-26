#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import (
    TYPE_CHECKING,
    Any,
    Literal,
    Mapping,
    Sequence,
    Unpack,
    overload,
)

# External imports
import numpy.typing as npt

if TYPE_CHECKING:
    import pandas as pd
    from pandas.core.groupby import GroupBy

# Bokeh imports
from .._types import JSON
from ..core.has_props import Setter
from ..model.model import Model, _ModelInit
from .callbacks import CustomJS
from .filters import Filter
from .selections import GraphSelectionPolicy, Selection, SelectionPolicy

__all__ = (
    "AjaxDataSource",
    "CDSView",
    "ColumnarDataSource",
    "ColumnDataSource",
    "DataSource",
    "GeoJSONDataSource",
    "GeometryDataSource",
    "GraphDataSource",
    "IndexedDataSource",
    "ServerSentDataSource",
    "WebDataSource",
)

type DataDict = dict[str, Sequence[Any] | npt.NDArray[Any] | pd.Series[Any] | pd.Index[Any]]  # pyright: ignore[reportInvalidTypeArguments]

type DataDictLike = DataDict | pd.DataFrame | GroupBy[Any]

type Index = int | slice | tuple[int | slice, ...]

type Patches = Mapping[str, Sequence[tuple[Index, Any]]]

class _DataSourceInit(_ModelInit, total=False):
    ...

class DataSource(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DataSourceInit]) -> None: ...

class _IndexedDataSourceInit(_DataSourceInit, total=False):
    selected: Selection
    selection_policy: SelectionPolicy

class IndexedDataSource(DataSource):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_IndexedDataSourceInit]) -> None: ...

    selected: Selection = ...
    selection_policy: SelectionPolicy = ...

class _ColumnarDataSourceInit(_IndexedDataSourceInit, total=False):
    default_values: dict[str, Any]

class ColumnarDataSource(IndexedDataSource):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ColumnarDataSourceInit]) -> None: ...

    default_values: dict[str, Any] = ...

class _ColumnDataSourceInit(_ColumnarDataSourceInit, total=False):
    data: DataDictLike

class ColumnDataSource(ColumnarDataSource):
    @overload
    def __init__(self, **kwargs: Unpack[_ColumnDataSourceInit]) -> None: ...
    @overload
    def __init__(self, data: DataDictLike, /, **kwargs: Unpack[_ColumnDataSourceInit]) -> None: ...

    @property
    def data(self) -> DataDict: ...
    @data.setter
    def data(self, data: DataDictLike) -> None: ...

    @property
    def column_names(self) -> list[str]: ...

    @property
    def length(self) -> int: ...

    @classmethod
    def from_df(cls, data: pd.DataFrame) -> DataDict: ...

    @classmethod
    def from_groupby(cls, data: GroupBy[Any]) -> DataDict: ...

    def to_df(self) -> pd.DataFrame: ...

    def add(self, data: Sequence[Any], name: str | None = ...) -> str: ...

    def remove(self, name: str) -> None: ...

    def stream(self, new_data: DataDict, rollover: int | None = ...) -> None: ...

    def patch(self, patches: Patches, setter: Setter | None = ...) -> None: ...

type GraphNodes = IndexedDataSource | Mapping[Any, Any] | Sequence[Any]
type GraphEdges = IndexedDataSource | Mapping[str, Sequence[Any]] | Sequence[Any]

class _GraphDataSourceInit(_DataSourceInit, total=False):
    graph: Any
    nodes: GraphNodes
    edges: GraphEdges
    selection_policy: GraphSelectionPolicy

class GraphDataSource(DataSource):
    @overload
    def __init__(self, **kwargs: Unpack[_GraphDataSourceInit]) -> None: ...
    @overload
    def __init__(self, graph: Any, /, **kwargs: Unpack[_GraphDataSourceInit]) -> None: ...

    nodes: IndexedDataSource = ...
    edges: IndexedDataSource = ...
    selection_policy: GraphSelectionPolicy = ...

type Geometry = Mapping[str, Any]
type GeometryData = Mapping[str, Sequence[Any]]

class _GeometryDataSourceInit(_IndexedDataSourceInit, total=False):
    geometries: Sequence[Geometry | None]
    data: GeometryData
    crs: str | None

class GeometryDataSource(IndexedDataSource):
    @overload
    def __init__(self, **kwargs: Unpack[_GeometryDataSourceInit]) -> None: ...
    @overload
    def __init__(self, data: Any, /, **kwargs: Unpack[_GeometryDataSourceInit]) -> None: ...

    geometries: Sequence[Geometry | None] = ...
    data: GeometryData = ...
    crs: str | None = ...

    @property
    def column_names(self) -> list[str]: ...

    @property
    def length(self) -> int: ...

    def stream(self, new_data: Any, rollover: int | None = ..., setter: Setter | None = ...) -> None: ...
    def patch(self, patches: Mapping[str, Sequence[tuple[int, Any]]], setter: Setter | None = ...) -> None: ...

class _CDSViewInit(_ModelInit, total=False):
    filter: Filter

class CDSView(Model):
    def __init__(self, **kwargs: Unpack[_CDSViewInit]) -> None: ...

    filter: Filter = ...

class _GeoJSONDataSourceInit(_GeometryDataSourceInit, total=False):
    geojson: JSON

class GeoJSONDataSource(GeometryDataSource):
    def __init__(self, **kwargs: Unpack[_GeoJSONDataSourceInit]) -> None: ...

    geojson: JSON = ...

class _WebDataSourceInit(_ColumnDataSourceInit, total=False):
    adapter: CustomJS | None
    max_size: int | None
    mode: Literal["replace", "append"]
    data_url: str

class WebDataSource(ColumnDataSource):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_WebDataSourceInit]) -> None: ...

    adapter: CustomJS | None = ...
    max_size: int | None = ...
    mode: Literal["replace", "append"] = ...
    data_url: str = ...

class _ServerSentDataSourceInit(_WebDataSourceInit, total=False):
    ...

class ServerSentDataSource(WebDataSource):
    def __init__(self, **kwargs: Unpack[_ServerSentDataSourceInit]) -> None: ...

class _AjaxDataSourceInit(_WebDataSourceInit, total=False):
    polling_interval: int | None
    method: Literal["POST", "GET"]
    if_modified: bool
    content_type: str
    http_headers: dict[str, str]

class AjaxDataSource(WebDataSource):
    def __init__(self, **kwargs: Unpack[_AjaxDataSourceInit]) -> None: ...

    polling_interval: int | None = ...
    method: Literal["POST", "GET"] = ...
    if_modified: bool = ...
    content_type: str = ...
    http_headers: dict[str, str] = ...
