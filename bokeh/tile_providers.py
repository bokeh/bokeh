#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2017, Anaconda, Inc. All rights reserved.
#
# Powered by the Bokeh Development Team.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Pre-configured tile sources for common third party tile services.

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

# External imports

# Bokeh imports
from .models.tiles import WMTSTileSource

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'STAMEN_TONER',
    'STAMEN_TONER_BACKGROUND',
    'STAMEN_TONER_LABELS',
    'STAMEN_TERRAIN',
    'CARTODBPOSITRON',
    'CARTODBPOSITRON_RETINA',
)


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

#: Tile Source for Stamen Toner Service
STAMEN_TONER = WMTSTileSource(
    url='http://tile.stamen.com/toner/{Z}/{X}/{Y}.png',
    attribution=_STAMEN_ATTRIBUTION % '<a href="http://www.openstreetmap.org/copyright">ODbL</a>'
)

#: Tile Source for Stamen Toner Background Service which does not include labels
STAMEN_TONER_BACKGROUND = WMTSTileSource(
    url='http://tile.stamen.com/toner-background/{Z}/{X}/{Y}.png',
    attribution=_STAMEN_ATTRIBUTION % '<a href="http://www.openstreetmap.org/copyright">ODbL</a>'
)

#: Tile Source for Stamen Toner Service which includes only labels
STAMEN_TONER_LABELS = WMTSTileSource(
    url='http://tile.stamen.com/toner-labels/{Z}/{X}/{Y}.png',
    attribution=_STAMEN_ATTRIBUTION % '<a href="http://www.openstreetmap.org/copyright">ODbL</a>'
)

#: Tile Source for Stamen Terrain Service
STAMEN_TERRAIN = WMTSTileSource(
    url='http://tile.stamen.com/terrain/{Z}/{X}/{Y}.png',
    attribution=_STAMEN_ATTRIBUTION % '<a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
)

#: Tile Source for CartoDB Tile Service
CARTODBPOSITRON = WMTSTileSource(
    url='http://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution=_CARTO_ATTRIBUTION
)

#: Tile Source for CartoDB Tile Service (tiles at 'retina' resolution)
CARTODBPOSITRON_RETINA = WMTSTileSource(
    url='http://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
    attribution=_CARTO_ATTRIBUTION
)

#-----------------------------------------------------------------------------
# Public API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Internal API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
