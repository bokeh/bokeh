#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
'''

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from ..core.properties import Any, Bool, Dict, Float, Int, Override, String
from ..model import Model

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'TileSource',
    'MercatorTileSource',
    'TMSTileSource',
    'WMTSTileSource',
    'QUADKEYTileSource',
    'BBoxTileSource',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TileSource(Model):
    ''' A base class for all tile source types.

    In general, tile sources are used as a required input for ``TileRenderer``.

    '''

    _args = ('url', 'tile_size', 'min_zoom', 'max_zoom', 'extra_url_vars')

    url = String("", help="""
    Tile service url e.g., http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png
    """)

    tile_size = Int(default=256, help="""
    Tile size in pixels (e.g. 256)
    """)

    min_zoom = Int(default=0, help="""
    A minimum zoom level for the tile layer. This is the most zoomed-out level.
    """)

    max_zoom = Int(default=30, help="""
    A maximum zoom level for the tile layer. This is the most zoomed-in level.
    """)

    extra_url_vars = Dict(String, Any, help="""
    A dictionary that maps url variable template keys to values.

    These variables are useful for parts of tile urls which do not change from
    tile to tile (e.g. server host name, or layer name).
    """)

    attribution = String("", help="""
    Data provider attribution content. This can include HTML content.
    """)

    x_origin_offset = Float(help="""
    An x-offset in plot coordinates
    """)

    y_origin_offset = Float(help="""
    A y-offset in plot coordinates
    """)

    initial_resolution = Float(help="""
    Resolution (plot_units / pixels) of minimum zoom level of tileset
    projection. None to auto-compute.
    """)

class MercatorTileSource(TileSource):
    ''' A base class for Mercator tile services (e.g. ``WMTSTileSource``).

    '''

    _args = ('url', 'tile_size', 'min_zoom', 'max_zoom', 'x_origin_offset', 'y_origin_offset', 'extra_url_vars', 'initial_resolution')

    x_origin_offset = Override(default=20037508.34)

    y_origin_offset = Override(default=20037508.34)

    initial_resolution = Override(default=156543.03392804097)

    snap_to_zoom = Bool(default=False, help="""
    Forces initial extents to snap to the closest larger zoom level.""")

    wrap_around = Bool(default=True, help="""
    Enables continuous horizontal panning by wrapping the x-axis based on
    bounds of map.

    ..note::
        Axis coordinates are not wrapped. To toggle axis label visibility,
        use ``plot.axis.visible = False``.

    """)

class TMSTileSource(MercatorTileSource):
    ''' Contains tile config info and provides urls for tiles based on a
    templated url e.g. ``http://your.tms.server.host/{Z}/{X}/{Y}.png``. The
    defining feature of TMS is the tile-origin in located at the bottom-left.

    ``TMSTileSource`` can also be helpful in implementing tile renderers for
    custom tile sets, including non-spatial datasets.

    '''
    pass

class WMTSTileSource(MercatorTileSource):
    ''' Behaves much like ``TMSTileSource`` but has its tile-origin in the
    top-left.

    This is the most common used tile source for web mapping applications.
    Such companies as Google, MapQuest, Stamen, Esri, and OpenStreetMap provide
    service which use the WMTS specification e.g. ``http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png``.

    '''
    pass

class QUADKEYTileSource(MercatorTileSource):
    ''' Has the same tile origin as the ``WMTSTileSource`` but requests tiles using
    a `quadkey` argument instead of X, Y, Z e.g.
    ``http://your.quadkey.tile.host/{Q}.png``

    '''
    pass

class BBoxTileSource(MercatorTileSource):
    ''' Has the same default tile origin as the ``WMTSTileSource`` but requested
    tiles use a ``{XMIN}``, ``{YMIN}``, ``{XMAX}``, ``{YMAX}`` e.g.
    ``http://your.custom.tile.service?bbox={XMIN},{YMIN},{XMAX},{YMAX}``.

    '''

    use_latlon = Bool(default=False, help="""
    Flag which indicates option to output ``{XMIN}``, ``{YMIN}``, ``{XMAX}``, ``{YMAX}`` in meters or latitude and longitude.
    """)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
