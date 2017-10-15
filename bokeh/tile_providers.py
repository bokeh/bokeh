#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Pre-configured tile sources for common third party tile services.


Attributes:

    CARTODBPOSITRON
        Tile Source for CartoDB Tile Service

    CARTODBPOSITRON_RETINA
        Tile Source for CartoDB Tile Service (tiles at 'retina' resolution)

    STAMEN_TERRAIN
        Tile Source for Stamen Terrain Service

    STAMEN_TONER
        Tile Source for Stamen Toner Service

    STAMEN_TONER_BACKGROUND
        Tile Source for Stamen Toner Background Service which does not include labels

    STAMEN_TONER_LABELS
        Tile Source for Stamen Toner Service which includes only labels

Additional information available at:

* Stamen tile service - http://maps.stamen.com/
* CartoDB tile service - https://carto.com/location-data-services/basemaps/

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

import logging
log = logging.getLogger(__name__)

from bokeh.util.api import public, internal ; public, internal

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
import types

# External imports

# Bokeh imports
from .models.tiles import WMTSTileSource

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# __all__ defined at the bottom on the class module

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

_CARTO_ATTRIBUTION = (
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors,'
    '&copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
)

_STAMEN_ATTRIBUTION = (
    'Map tiles by <a href="http://stamen.com">Stamen Design</a>, '
    'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. '
    'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, '
    'under %s.'
)

class _TileProvidersModule(types.ModuleType):

    @property
    def STAMEN_TONER(self):
        return WMTSTileSource(
            url='http://tile.stamen.com/toner/{Z}/{X}/{Y}.png',
            attribution=_STAMEN_ATTRIBUTION % '<a href="http://www.openstreetmap.org/copyright">ODbL</a>'
        )

    @property
    def STAMEN_TONER_BACKGROUND(self):
        return WMTSTileSource(
            url='http://tile.stamen.com/toner-background/{Z}/{X}/{Y}.png',
            attribution=_STAMEN_ATTRIBUTION % '<a href="http://www.openstreetmap.org/copyright">ODbL</a>'
        )

    @property
    def STAMEN_TONER_LABELS(self):
        return WMTSTileSource(
            url='http://tile.stamen.com/toner-labels/{Z}/{X}/{Y}.png',
            attribution=_STAMEN_ATTRIBUTION % '<a href="http://www.openstreetmap.org/copyright">ODbL</a>'
        )

    @property
    def STAMEN_TERRAIN(self):
        return WMTSTileSource(
            url='http://tile.stamen.com/terrain/{Z}/{X}/{Y}.png',
            attribution=_STAMEN_ATTRIBUTION % '<a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
        )

    @property
    def CARTODBPOSITRON(self):
        return WMTSTileSource(
            url='http://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            attribution=_CARTO_ATTRIBUTION
        )

    @property
    def CARTODBPOSITRON_RETINA(self):
        return WMTSTileSource(
            url='http://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            attribution=_CARTO_ATTRIBUTION
        )

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

_mod = _TileProvidersModule('bokeh.tile_providers')
_mod.__doc__ = __doc__
_mod.__all__ = (
    'STAMEN_TONER',
    'STAMEN_TONER_BACKGROUND',
    'STAMEN_TONER_LABELS',
    'STAMEN_TERRAIN',
    'CARTODBPOSITRON',
    'CARTODBPOSITRON_RETINA',
)
sys.modules['bokeh.tile_providers'] = _mod
del _mod, sys, types
