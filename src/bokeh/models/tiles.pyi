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
from ..model.model import Model, _ModelInit

class _TileSourceInit(_ModelInit, total=False):
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
    def __init__(self, **kwargs: Unpack[_TileSourceInit]) -> None: ...

    url: str = ...
    tile_size: int = ...
    min_zoom: int = ...
    max_zoom: int = ...
    extra_url_vars: dict[str, Any] = ...
    attribution: str = ...
    x_origin_offset: float = ...
    y_origin_offset: float = ...
    initial_resolution: float | None = ...

class _MercatorTileSourceInit(_TileSourceInit, total=False):
    snap_to_zoom: bool
    wrap_around: bool

class MercatorTileSource(TileSource):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MercatorTileSourceInit]) -> None: ...

    snap_to_zoom: bool = ...
    wrap_around: bool = ...

class _TMSTileSourceInit(_MercatorTileSourceInit, total=False):
    ...

class TMSTileSource(MercatorTileSource):
    def __init__(self, **kwargs: Unpack[_TMSTileSourceInit]) -> None: ...

class _WMTSTileSourceInit(_MercatorTileSourceInit, total=False):
    ...

class WMTSTileSource(MercatorTileSource):
    def __init__(self, **kwargs: Unpack[_WMTSTileSourceInit]) -> None: ...

class _QUADKEYTileSourceInit(_MercatorTileSourceInit, total=False):
    ...

class QUADKEYTileSource(MercatorTileSource):
    def __init__(self, **kwargs: Unpack[_QUADKEYTileSourceInit]) -> None: ...

class _BBoxTileSourceInit(_MercatorTileSourceInit, total=False):
    use_latlon: bool

class BBoxTileSource(MercatorTileSource):
    def __init__(self, **kwargs: Unpack[_BBoxTileSourceInit]) -> None: ...

    use_latlon: bool = ...
