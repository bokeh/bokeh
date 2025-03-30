#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import (
    TYPE_CHECKING,
    Any,
    Literal,
    Sequence,
    TypeAlias,
    overload,
)

# External imports
import numpy.typing as npt

if TYPE_CHECKING:
    import pandas as pd
    from pandas.core.groupby import GroupBy

# Bokeh imports
from .._types import JSON
from ..core.has_props import Setter, abstract
from ..model import Model
from .callbacks import CustomJS
from .filters import Filter
from .selections import Selection, SelectionPolicy

DataDict: TypeAlias = dict[str, Sequence[Any] | npt.NDArray[Any] | pd.Series[Any] | pd.Index[Any]]

DataDictLike: TypeAlias = DataDict | pd.DataFrame | GroupBy[Any]

Index: TypeAlias = int | slice | tuple[int | slice, ...]

Patches: TypeAlias = dict[str, list[tuple[Index, Any]]]

@abstract
@dataclass(init=False)
class DataSource(Model):

    selected: Selection = ...

@abstract
@dataclass(init=False)
class ColumnarDataSource(DataSource):

    default_values: dict[str, Any] = ...

    selection_policy: SelectionPolicy = ...

@dataclass
class ColumnDataSource(ColumnarDataSource):

    # TODO asymmetric get/set
    data: DataDictLike = ...

    @overload
    def __init__(self, data: DataDictLike, **kwargs: Any) -> None: ...
    @overload
    def __init__(self, **kwargs: Any) -> None: ...

    def __init__(self, *args: Any, **kwargs: Any) -> None: ...

    @property
    def column_names(self) -> list[str]: ...

    @property
    def length(self) -> int: ...

    @classmethod
    def from_df(cls, data: pd.DataFrame) -> DataDict: ...

    @classmethod
    def from_groupby(cls, data: GroupBy[Any]) -> DataDict: ...

    def to_df(self) -> pd.DataFrame: ...

    def add(self, data: Sequence[Any], name: str | None) -> str: ...

    def remove(self, name: str) -> None: ...

    def stream(self, new_data: DataDict, rollover: int | None) -> None: ...

    def patch(self, patches: Patches, setter: Setter | None) -> None: ...

@dataclass
class CDSView(Model):

    filter: Filter = ...

@dataclass
class GeoJSONDataSource(ColumnarDataSource):

    geojson: JSON = ...

@abstract
@dataclass(init=False)
class WebDataSource(ColumnDataSource):

    adapter: CustomJS | None = ...

    max_size: int | None = ...

    mode: Literal["replace", "append"] = ...

    data_url: str = ...

@dataclass
class ServerSentDataSource(WebDataSource):
    ...

@dataclass
class AjaxDataSource(WebDataSource):

    polling_interval: int | None = ...

    method: Literal["POST", "GET"] = ...

    if_modified: bool = ...

    content_type: str = ...

    http_headers: dict[str, str] = ...
