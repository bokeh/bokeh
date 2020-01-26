#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Pre-configured tile sources for common third party tile services.


Attributes:

    .. bokeh-enum:: Vendors
        :module: bokeh.tile_providers

    get_provider
        Use this function to retrieve an instance of a predefined tile provider.

        Args:
            provider_name (Union[str, Vendors])
                Name of the tile provider to supply.
                Use tile_providers.Vendors enum, or the name of a provider as string

        Returns:
            WMTSTileProviderSource: The desired tile provider instance

        Raises:
            ValueError, if the provider can not be found
            ValueError, if the attribution for that provider can not be found


        Example:

            .. code-block:: python

                    >>> from bokeh.tile_providers import get_provider, Vendors
                    >>> get_provider(Vendors.CARTODBPOSITRON)
                    <class 'bokeh.models.tiles.WMTSTileSource'>
                    >>> get_provider('CARTODBPOSITRON')
                    <class 'bokeh.models.tiles.WMTSTileSource'>


    CARTODBPOSITRON
        Tile Source for CartoDB Tile Service

        Warns:
            BokehDeprecationWarning: Deprecated in bokeh 1.1.0. Use get_provider instead

        .. raw:: html

            <img src="https://tiles.basemaps.cartocdn.com/light_all/14/2627/6331.png" />

    CARTODBPOSITRON_RETINA
        Tile Source for CartoDB Tile Service (tiles at 'retina' resolution)

        Warns:
            BokehDeprecationWarning: Deprecated in bokeh 1.1.0. Use get_provider instead

        .. raw:: html

            <img src="https://tiles.basemaps.cartocdn.com/light_all/14/2627/6331@2x.png" />

    STAMEN_TERRAIN
        Tile Source for Stamen Terrain Service

        Warns:
            BokehDeprecationWarning: Deprecated in bokeh 1.1.0. Use get_provider instead

        .. raw:: html

            <img src="http://c.tile.stamen.com/terrain/14/2627/6331.png" />

    STAMEN_TERRAIN_RETINA
        Tile Source for Stamen Terrain Service

        Warns:
            BokehDeprecationWarning: Deprecated in bokeh 1.1.0. Use get_provider instead

        .. raw:: html

            <img src="http://c.tile.stamen.com/terrain/14/2627/6331@2x.png" />

    STAMEN_TONER
        Tile Source for Stamen Toner Service

        Warns:
            BokehDeprecationWarning: Deprecated in bokeh 1.1.0. Use get_provider instead

        .. raw:: html

            <img src="http://c.tile.stamen.com/toner/14/2627/6331.png" />

    STAMEN_TONER_BACKGROUND
        Tile Source for Stamen Toner Background Service which does not include labels

        Warns:
            BokehDeprecationWarning: Deprecated in bokeh 1.1.0. Use get_provider instead

        .. raw:: html

            <img src="http://c.tile.stamen.com/toner-background/14/2627/6331.png" />

    STAMEN_TONER_LABELS
        Tile Source for Stamen Toner Service which includes only labels

        Warns:
            BokehDeprecationWarning: Deprecated in bokeh 1.1.0. Use get_provider instead

        .. raw:: html

            <img src="http://c.tile.stamen.com/toner-labels/14/2627/6331.png" />

Additional information available at:

* Stamen tile service - http://maps.stamen.com/
* CartoDB tile service - https://carto.com/location-data-services/basemaps/

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip

log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import sys
import types

# Bokeh imports
from bokeh.core.enums import enumeration

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

    _OSM_ATTRIBTION = (
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    )

    _WIKIMEDIA_ATTRIBUTION = (
        '&copy; <a href="https://foundation.wikimedia.org/wiki/Maps_Terms_of_Use">Wikimedia Maps</a> contributors'
    )

    _ESRI_IMAGERY_ATTRIBUTION = (
        '&copy; <a href="http://downloads.esri.com/ArcGISOnline/docs/tou_summary.pdf">Esri</a>, '
        'Earthstar Geographics'
    )

    _SERVICE_URLS = dict(
        CARTODBPOSITRON='https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        CARTODBPOSITRON_RETINA='https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        STAMEN_TERRAIN='http://tile.stamen.com/terrain/{Z}/{X}/{Y}.png',
        STAMEN_TERRAIN_RETINA='http://tile.stamen.com/terrain/{Z}/{X}/{Y}@2x.png',
        STAMEN_TONER='http://tile.stamen.com/toner/{Z}/{X}/{Y}.png',
        STAMEN_TONER_BACKGROUND='http://tile.stamen.com/toner-background/{Z}/{X}/{Y}.png',
        STAMEN_TONER_LABELS='http://tile.stamen.com/toner-labels/{Z}/{X}/{Y}.png',
        OSM='https://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png',
        WIKIMEDIA='https://maps.wikimedia.org/osm-intl/{Z}/{X}/{Y}@2x.png',
        ESRI_IMAGERY='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{Y}/{X}.jpg'
    )

    _STAMEN_ATTRIBUTION_URLS = dict(
        STAMEN_TERRAIN='<a href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>',
        STAMEN_TERRAIN_RETINA='<a href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>',
        STAMEN_TONER='<a href="https://www.openstreetmap.org/copyright">ODbL</a>',
        STAMEN_TONER_BACKGROUND='<a href="https://www.openstreetmap.org/copyright">ODbL</a>',
        STAMEN_TONER_LABELS='<a href="https://www.openstreetmap.org/copyright">ODbL</a>',
    )

    Vendors = enumeration('CARTODBPOSITRON', 'CARTODBPOSITRON_RETINA',
                          'STAMEN_TERRAIN', 'STAMEN_TERRAIN_RETINA', 'STAMEN_TONER',
                          'STAMEN_TONER_BACKGROUND', 'STAMEN_TONER_LABELS',
                          'OSM','WIKIMEDIA','ESRI_IMAGERY',
                          case_sensitive=True)

    def get_provider(self, provider_name):
        from bokeh.models import WMTSTileSource

        if isinstance(provider_name, WMTSTileSource):
            # This allows `get_provider(CARTODBPOSITRON)` to work
            return WMTSTileSource(url=provider_name.url, attribution=provider_name.attribution)

        selected_provider = provider_name.upper()

        if selected_provider not in self.Vendors:
            raise ValueError('Unknown tile provider %s' % provider_name)

        url = self._SERVICE_URLS[selected_provider]
        if selected_provider.startswith('CARTO'):
            attribution = self._CARTO_ATTRIBUTION
        elif selected_provider.startswith('STAMEN'):
            attribution = self._STAMEN_ATTRIBUTION % self._STAMEN_ATTRIBUTION_URLS[selected_provider]
        elif selected_provider.startswith('OSM'):
            attribution = self._OSM_ATTRIBTION
        elif selected_provider.startswith('WIKIMEDIA'):
            attribution = self._WIKIMEDIA_ATTRIBUTION
        elif selected_provider.startswith('ESRI_IMAGERY'):
            attribution = self._ESRI_IMAGERY_ATTRIBUTION
        else:
            raise ValueError('Can not retrieve attribution for %s' % selected_provider)
        return WMTSTileSource(url=url, attribution=attribution)

    # Properties --------------------------------------------------------------

    CARTODBPOSITRON = Vendors.CARTODBPOSITRON
    CARTODBPOSITRON_RETINA = Vendors.CARTODBPOSITRON_RETINA
    STAMEN_TERRAIN = Vendors.STAMEN_TERRAIN
    STAMEN_TERRAIN_RETINA = Vendors.STAMEN_TERRAIN_RETINA
    STAMEN_TONER = Vendors.STAMEN_TONER
    STAMEN_TONER_BACKGROUND = Vendors.STAMEN_TONER_BACKGROUND
    STAMEN_TONER_LABELS = Vendors.STAMEN_TONER_LABELS
    OSM = Vendors.OSM
    WIKIMEDIA = Vendors.WIKIMEDIA
    ESRI_IMAGERY = Vendors.ESRI_IMAGERY

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
    'OSM',
    'WIKIMEDIA',
    'ESRI_IMAGERY',
    'get_provider',
    'Vendors'
)
sys.modules['bokeh.tile_providers'] = _mod
del _mod, sys, types
