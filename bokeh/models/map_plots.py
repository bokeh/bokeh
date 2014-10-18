from __future__ import absolute_import

from ..properties import HasProps
from ..properties import Int, Float, Enum, Instance
from ..enums import MapType

from .plots import Plot

class GMapOptions(HasProps):
    lat = Float
    lng = Float
    zoom = Int(12)
    map_type = Enum(MapType)

class GMapPlot(Plot):
    map_options = Instance(GMapOptions)

class GeoJSOptions(HasProps):
    lat = Float
    lng = Float
    zoom = Int(12)

class GeoJSPlot(Plot):
    map_options = Instance(GeoJSOptions)
