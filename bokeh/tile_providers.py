#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2018, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Pre-configured tile sources for common third party tile services.


Attributes:

    CARTODBPOSITRON
        Tile Source for CartoDB Tile Service

        .. raw:: html

            <img src="https://tiles.basemaps.cartocdn.com/light_all/14/2627/6331.png" />

    CARTODBPOSITRON_RETINA
        Tile Source for CartoDB Tile Service (tiles at 'retina' resolution)

        .. raw:: html

            <img src="https://tiles.basemaps.cartocdn.com/light_all/14/2627/6331@2x.png" />

    STAMEN_TERRAIN
        Tile Source for Stamen Terrain Service

        .. raw:: html

            <img src="http://c.tile.stamen.com/terrain/14/2627/6331.png" />

    STAMEN_TERRAIN_RETINA
        Tile Source for Stamen Terrain Service

        .. raw:: html

            <img src="http://c.tile.stamen.com/terrain/14/2627/6331@2x.png" />

    STAMEN_TONER
        Tile Source for Stamen Toner Service

        .. raw:: html

            <img src="http://c.tile.stamen.com/toner/14/2627/6331.png" />

    STAMEN_TONER_BACKGROUND
        Tile Source for Stamen Toner Background Service which does not include labels

        .. raw:: html

            <img src="http://c.tile.stamen.com/toner-background/14/2627/6331.png" />

    STAMEN_TONER_LABELS
        Tile Source for Stamen Toner Service which includes only labels

        .. raw:: html

            <img src="http://c.tile.stamen.com/toner-labels/14/2627/6331.png" />

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

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
import types

# External imports

# Bokeh imports

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

# __all__ defined at the bottom on the class module

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

class _TileProvidersModule(types.ModuleType):

    _CARTO_ATTRIBUTION = (
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors,'
        '&copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
    )

    _STAMEN_ATTRIBUTION = (
        'Map tiles by <a href="https://stamen.com">Stamen Design</a>, '
        'under <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. '
        'Data by <a href="https://openstreetmap.org">OpenStreetMap</a>, '
        'under %s.'
    )

    # Properties --------------------------------------------------------------

    @property
    def CARTODBPOSITRON(self):
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            attribution=self._CARTO_ATTRIBUTION
        )

    @property
    def CARTODBPOSITRON_RETINA(self):
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            attribution=self._CARTO_ATTRIBUTION
        )

    @property
    def STAMEN_TERRAIN(self):
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='http://tile.stamen.com/terrain/{Z}/{X}/{Y}.png',
            attribution=self._STAMEN_ATTRIBUTION % '<a href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
        )

    @property
    def STAMEN_TERRAIN_RETINA(self):
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='http://tile.stamen.com/terrain/{Z}/{X}/{Y}@2x.png',
            attribution=self._STAMEN_ATTRIBUTION % '<a href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
        )

    @property
    def STAMEN_TONER(self):
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='http://tile.stamen.com/toner/{Z}/{X}/{Y}.png',
            attribution=self._STAMEN_ATTRIBUTION % '<a href="https://www.openstreetmap.org/copyright">ODbL</a>'
        )

    @property
    def STAMEN_TONER_BACKGROUND(self):
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='http://tile.stamen.com/toner-background/{Z}/{X}/{Y}.png',
            attribution=self._STAMEN_ATTRIBUTION % '<a href="https://www.openstreetmap.org/copyright">ODbL</a>'
        )

    @property
    def STAMEN_TONER_LABELS(self):
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='http://tile.stamen.com/toner-labels/{Z}/{X}/{Y}.png',
            attribution=self._STAMEN_ATTRIBUTION % '<a href="https://www.openstreetmap.org/copyright">ODbL</a>'
        )

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

_mod = _TileProvidersModule(str('bokeh.tile_providers'))
_mod.__doc__ = __doc__
_mod.__all__ = (
    'CARTODBPOSITRON',
    'CARTODBPOSITRON_RETINA',
    'STAMEN_TERRAIN',
    'STAMEN_TERRAIN_RETINA',
    'STAMEN_TONER',
    'STAMEN_TONER_BACKGROUND',
    'STAMEN_TONER_LABELS',
)
sys.modules['bokeh.tile_providers'] = _mod
del _mod, sys, types
