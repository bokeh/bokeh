#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Any, Unpack

# Bokeh imports
from ..model.model import Model, ModelInit

class TileSourceInit(ModelInit, total=False):
    url: str
    tile_size: int
    min_zoom: int
    max_zoom: int
    extra_url_vars: dict[str, Any]
    attribution: str
    x_origin_offset: float
    y_origin_offset: float
    initial_resolution: float | None

class TileSource(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[TileSourceInit]) -> None: ...

    url: str = ...
    tile_size: int = ...
    min_zoom: int = ...
    max_zoom: int = ...
    extra_url_vars: dict[str, Any] = ...
    attribution: str = ...
    x_origin_offset: float = ...
    y_origin_offset: float = ...
    initial_resolution: float | None = ...

class MercatorTileSourceInit(TileSourceInit, total=False):
    snap_to_zoom: bool
    wrap_around: bool

class MercatorTileSource(TileSource):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[MercatorTileSourceInit]) -> None: ...

    snap_to_zoom: bool = ...
    wrap_around: bool = ...

class TMSTileSourceInit(MercatorTileSourceInit, total=False):
    ...

class TMSTileSource(MercatorTileSource):
    def __init__(self, **kwargs: Unpack[TMSTileSourceInit]) -> None: ...

class WMTSTileSourceInit(MercatorTileSourceInit, total=False):
    ...

class WMTSTileSource(MercatorTileSource):
    def __init__(self, **kwargs: Unpack[WMTSTileSourceInit]) -> None: ...

class QUADKEYTileSourceInit(MercatorTileSourceInit, total=False):
    ...

class QUADKEYTileSource(MercatorTileSource):
    def __init__(self, **kwargs: Unpack[QUADKEYTileSourceInit]) -> None: ...

class BBoxTileSourceInit(MercatorTileSourceInit, total=False):
    use_latlon: bool

class BBoxTileSource(MercatorTileSource):
    def __init__(self, **kwargs: Unpack[BBoxTileSourceInit]) -> None: ...

    use_latlon: bool = ...
