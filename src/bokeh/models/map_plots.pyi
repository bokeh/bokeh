#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from abc import abstractmethod
from typing import Unpack

# Bokeh imports
from .._types import JSON, Bytes
from ..core.enums import MapTypeType as MapType
from ..model.model import Model, ModelInit
from .plots import Plot, PlotInit

class MapOptionsInit(ModelInit, total=False):
    lat: float
    lng: float
    zoom: int

class MapOptions(Model):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[MapOptionsInit]) -> None: ...

    lat: float = ...
    lng: float = ...
    zoom: int = ...

class MapPlotInit(PlotInit, total=False):
    ...

class MapPlot(Plot):
    @abstractmethod
    def __init__(self, **kwargs: Unpack[MapPlotInit]) -> None: ...

class GMapOptionsInit(MapOptionsInit, total=False):
    map_type: MapType
    scale_control: bool
    styles: JSON | None
    tilt: int

class GMapOptions(MapOptions):
    def __init__(self, **kwargs: Unpack[GMapOptionsInit]) -> None: ...

    map_type: MapType = ...
    scale_control: bool = ...
    styles: JSON | None = ...
    tilt: int = ...

class GMapPlotInit(MapPlotInit, total=False):
    map_options: GMapOptions
    api_key: Bytes | str
    api_version: str

class GMapPlot(MapPlot):
    def __init__(self, **kwargs: Unpack[GMapPlotInit]) -> None: ...

    map_options: GMapOptions = ...

    @property
    def api_key(self) -> Bytes: ...
    @api_key.setter
    def api_key(self, api_key: Bytes | str) -> None: ...

    api_version: str = ...
