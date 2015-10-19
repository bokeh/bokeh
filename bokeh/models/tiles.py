from __future__ import absolute_import

from ..properties import (abstract, AngleSpec, Any, Array, Bool, Dict, DistanceSpec, Enum, Float,
                          Include, Instance, NumberSpec, StringSpec, String, Int)

class TileSource(HasProps):

    _args = ('url', 'tile_size', 'min_zoom', 'max_zoom', 'x_origin_offset', 'y_origin_offset', 'extra_url_vars', 'initial_resolution')

    url = String("url", help="""
    tile service url (example: http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png)
    """)

    tile_size = Int(default=256, help="""
    tile size in pixels (e.g. 256)
    """)

    min_zoom = Int(default=0, help="""
    the minimum zoom level for the tile layer. This is the most "zoomed-out" level.
    """)

    max_zoom = Int(default=30, help="""
    the maximum zoom level for the tile layer. This is the most "zoomed-in" level.
    """)

    x_origin_offset = Float(default=20037508.34, help="""
    x offset in plot coordinates
    """)

    y_origin_offset = Float(default=20037508.34, help="""
    y offset in plot coordinates
    """)
    
    extra_url_vars = Dict(String, Any(String, Int), help="""
    A dictionary that maps url variable template variables to string value
    """)

    initial_resolution = Float(default=1.0, help="""
    y offset in plot coordinates
    """)

class TMSTileSource(TileSource):
    pass

class WMTSTileSource(TileSource):
    pass

class QUADKEYTileSource(TileSource):
    pass
