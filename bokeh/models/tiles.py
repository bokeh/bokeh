from __future__ import absolute_import
from ..model import Model

from ..properties import (Any, Dict, Float, String, Int, Bool)

class TileSource(Model):
    """ A base class for all tile source types. ``TileSource`` is
    not generally useful to instantiate on its own. In general, tile sources are used as a required input for ``TileRenderer``.

     Subclasses should have these properties as well:
     x_origin_offset = Float
     y_origin_offset = Float
     initial_resolution = Float
    """

    _args = ('url', 'tile_size', 'min_zoom', 'max_zoom', 'extra_url_vars')

    url = String("", help="""
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

    extra_url_vars = Dict(String, Any, help="""
    A dictionary that maps url variable template keys to values.
    These variables are useful for parts of tile urls which do not change from tile to tile (e.g. server host name, or layer name).
    """)

class MercatorTileSource(TileSource):
    """``MercatorTileSource`` is not generally useful to instantiate on its own, but is the parent class of mercator tile services (e.g. ``WMTSTileSource``).
    """

    _args = ('url', 'tile_size', 'min_zoom', 'max_zoom', 'x_origin_offset', 'y_origin_offset', 'extra_url_vars', 'initial_resolution')

    x_origin_offset = Float(default=20037508.34, help="""
    x offset in plot coordinates
    """)

    y_origin_offset = Float(default=20037508.34, help="""
    y offset in plot coordinates
    """)

    initial_resolution = Float(default=156543.03392804097, help="""
    resolution (plot_units / pixels) of minimum zoom level of tileset projection. None to auto-compute.
    """)

class TMSTileSource(MercatorTileSource):
    """
    The TMSTileSource contains tile config info and provides urls for tiles based on a templated url (ex. http://your.tms.server.host/{Z}/{X}/{Y}.png).
    The defining feature of TMS is the tile-origin in located at the bottom-left.

    The TMSTileSource can also be helpful in implementing tile renderers for custom tile sets, including non-spatial datasets.
    """
    pass

class WMTSTileSource(MercatorTileSource):
    """
    The ``WMTSTileSource`` behaves much like ``TMSTileSource`` but has its tile-origin in the top-left.
    This is the most common used tile source for web mapping applications.
    Such companies as Google, MapQuest, Stamen, Esri, and OpenStreetMap provide service which use the WMTS specification.

    Example url: http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png
    """
    pass

class QUADKEYTileSource(MercatorTileSource):
    """
    The QUADKEYTileSource has the same tile origin as the WMTSTileSource but requests tiles using a `quadkey` argument instead of X,Y,Z.

    Example url: http://your.quadkey.tile.host/{Q}.png
    """
    pass

class BBoxTileSource(MercatorTileSource):
    """
    The BBoxTileSource has the same default tile origin as the WMTSTileSource but requested tiles use a {XMIN}, {YMIN}, {XMAX}, {YMAX}.

    Example url: http://your.custom.tile.serivce?bbox={XMIN},{YMIN},{XMAX},{YMAX}
    """
    use_latlon = Bool(default=False, help="""
    Flag which indicates option to output {XMIN},{YMIN},{XMAX},{YMAX} in meters or latitude and longitude.
    """)
