#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing_extensions import Unpack

# Bokeh imports
from .._types import JSON, Bytes
from ..core.enums import MapTypeType as MapType
from ..model.model import Model, _ModelInit
from .plots import Plot, _PlotInit

class _MapOptionsInit(_ModelInit, total=False):
    lat: float
    lng: float
    zoom: int

class MapOptions(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MapOptionsInit]) -> None: ...

    lat: float = ...
    lng: float = ...
    zoom: int = ...

class _MapPlotInit(_PlotInit, total=False):
    ...

class MapPlot(Plot):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[_MapPlotInit]) -> None: ...

class _GMapOptionsInit(_MapOptionsInit, total=False):
    map_type: MapType
    scale_control: bool
    styles: JSON | None
    tilt: int

class GMapOptions(MapOptions):
    def __init__(self, **kwargs: Unpack[_GMapOptionsInit]) -> None: ...

    map_type: MapType = ...
    scale_control: bool = ...
    styles: JSON | None = ...
    tilt: int = ...

class _GMapPlotInit(_MapPlotInit, total=False):
    map_options: GMapOptions
    api_key: Bytes | str
    api_version: str

class GMapPlot(MapPlot):
    def __init__(self, **kwargs: Unpack[_GMapPlotInit]) -> None: ...

    map_options: GMapOptions = ...

    @property
    def api_key(self) -> Bytes: ...
    @api_key.setter
    def api_key(self, api_key: Bytes | str) -> None: ...

    api_version: str = ...
