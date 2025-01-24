#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass
from typing import Any

# Bokeh imports
from ..model import Model

@dataclass
class TileSource(Model):

    url: str = ...

    tile_size: int = ...

    min_zoom: int = ...

    max_zoom: int = ...

    extra_url_vars: dict[str, Any] = ...

    attribution: str = ...

    x_origin_offset: float = ...

    y_origin_offset: float = ...

    initial_resolution: float | None = ...

@dataclass
class MercatorTileSource(TileSource):

    snap_to_zoom: bool = ...

    wrap_around: bool = ...

@dataclass
class TMSTileSource(MercatorTileSource):
    ...

@dataclass
class WMTSTileSource(MercatorTileSource):
    ...

@dataclass
class QUADKEYTileSource(MercatorTileSource):
    ...

@dataclass
class BBoxTileSource(MercatorTileSource):

    use_latlon: bool = ...
