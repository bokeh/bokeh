#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

# Standard library imports
from dataclasses import dataclass

# Bokeh imports
from .._types import JSON, Bytes
from ..core.enums import MapTypeType as MapType
from ..core.has_props import abstract
from ..model import Model
from .plots import Plot

@abstract
@dataclass(init=False)
class MapOptions(Model):

    lat: float = ...

    lng: float = ...

    zoom: int = ...

@abstract
@dataclass(init=False)
class MapPlot(Plot):
    ...

@dataclass
class GMapOptions(MapOptions):

    map_type: MapType = ...

    scale_control: bool = ...

    styles: JSON | None = ...

    tilt: int = ...

@dataclass
class GMapPlot(MapPlot):

    map_options: GMapOptions = ...

    api_key: Bytes | str = ...

    api_version: str = ...
