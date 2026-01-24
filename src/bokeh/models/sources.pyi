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
    Sequence,
    TypeAlias,
    overload,
)

if TYPE_CHECKING:
    from typing_extensions import Unpack

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
from .selections import Selection, SelectionPolicy

DataDict: TypeAlias = dict[str, Sequence[Any] | npt.NDArray[Any] | pd.Series[Any] | pd.Index[Any]]

DataDictLike: TypeAlias = DataDict | pd.DataFrame | GroupBy[Any]

Index: TypeAlias = int | slice | tuple[int | slice, ...]

Patches: TypeAlias = dict[str, list[tuple[Index, Any]]]

class _DataSourceInit(_ModelInit, total=False):
    selected: Selection

class DataSource(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_DataSourceInit]) -> None: ...

    selected: Selection = ...

class _ColumnarDataSourceInit(_DataSourceInit, total=False):
    default_values: dict[str, Any]
    selection_policy: SelectionPolicy

class ColumnarDataSource(DataSource):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_ColumnarDataSourceInit]) -> None: ...

    default_values: dict[str, Any] = ...
    selection_policy: SelectionPolicy = ...

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

class _CDSViewInit(_ModelInit, total=False):
    filter: Filter

class CDSView(Model):
    def __init__(self, **kwargs: Unpack[_CDSViewInit]) -> None: ...

    filter: Filter = ...

class _GeoJSONDataSourceInit(_ColumnarDataSourceInit, total=False):
    geojson: JSON

class GeoJSONDataSource(ColumnarDataSource):
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
