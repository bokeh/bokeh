#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Pre-configured tile sources for common third party tile services.


Attributes:

    ThirdParty
        Enum listing all available preconfigured tiling services

    get_provider
        Use this function to retrieve an instance of a predefined tile provider.

        Args:
            provider_name (Union[str, ThirdParty])
                Name of the tile provider to supply.
                Use tile_providers.ThirdParty enum, or the name of a provider as string
                

        Returns:
            WMTSTileProviderSource: The desired tile provider instance

        Raises:
            ValueError, if the provider can not be found
            ValueError, if the attribution for that provider can not be found


        Example:

            .. code-block:: python

                    >>> from bokeh.tile_providers import get_provider, ThirdParty
                    >>> get_provider(ThirdParty.CARTODBPOSITRON)
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

    _SERVICE_URLS = dict(
        CARTODBPOSITRON='https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        CARTODBPOSITRON_RETINA='https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        STAMEN_TERRAIN='http://tile.stamen.com/terrain/{Z}/{X}/{Y}.png',
        STAMEN_TERRAIN_RETINA='http://tile.stamen.com/terrain/{Z}/{X}/{Y}@2x.png',
        STAMEN_TONER='http://tile.stamen.com/toner/{Z}/{X}/{Y}.png',
        STAMEN_TONER_BACKGROUND='http://tile.stamen.com/toner-background/{Z}/{X}/{Y}.png',
        STAMEN_TONER_LABELS='http://tile.stamen.com/toner-labels/{Z}/{X}/{Y}.png',
    )

    ThirdParty = enumeration('CARTODBPOSITRON', 'CARTODBPOSITRON_RETINA',
                             'STAMEN_TERRAIN', 'STAMEN_TERRAIN_RETINA', 'STAMEN_TONER',
                             'STAMEN_TONER_BACKGROUND', 'STAMEN_TONER_LABELS',
                             case_sensitive=True)
    
    @staticmethod
    def get_provider(provider_name):
        from bokeh.models.tiles import WMTSTileSource

        if isinstance(provider_name, WMTSTileSource):
            # This allows `get_provider(CARTODBPOSITRON)` to work
            return WMTSTileSource(url=provider_name.url, attribution=provider_name.attribution)

        if provider_name not in _TileProvidersModule.ThirdParty:
            raise ValueError('Unknown tile provider {0}'.format(provider_name))

        selected_provider = provider_name.upper()
        url = _TileProvidersModule._SERVICE_URLS[selected_provider]
        if selected_provider.startswith('CARTO'):
            attribution = _TileProvidersModule._CARTO_ATTRIBUTION
        elif selected_provider.startswith('STAMEN'):
            attribution = _TileProvidersModule._STAMEN_ATTRIBUTION
        else:
            raise ValueError('Can not retrieve attribution for {0}'.format(selected_provider))
        return WMTSTileSource(url=url, attribution=attribution)

    # Properties --------------------------------------------------------------

    @property
    def CARTODBPOSITRON(self):
        from bokeh.util.deprecation import deprecated
        deprecated(since_or_msg=(1, 1, 0), old='CARTODBPOSITRON', new='get_provider(ThirdParty.CARTODBPOSITRON)')
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            attribution=self._CARTO_ATTRIBUTION
        )

    @property
    def CARTODBPOSITRON_RETINA(self):
        from bokeh.util.deprecation import deprecated
        deprecated(since_or_msg=(1, 1, 0), old='CARTODBPOSITRON_RETINA',
                   new='get_provider(ThirdParty.CARTODBPOSITRON_RETINA)')
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            attribution=self._CARTO_ATTRIBUTION
        )

    @property
    def STAMEN_TERRAIN(self):
        from bokeh.util.deprecation import deprecated
        deprecated(since_or_msg=(1, 1, 0), old='STAMEN_TERRAIN', new='get_provider(ThirdParty.STAMEN_TERRAIN)')
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='http://tile.stamen.com/terrain/{Z}/{X}/{Y}.png',
            attribution=self._STAMEN_ATTRIBUTION % '<a href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
        )

    @property
    def STAMEN_TERRAIN_RETINA(self):
        from bokeh.util.deprecation import deprecated
        deprecated(since_or_msg=(1, 1, 0), old='STAMEN_TERRAIN_RETINA',
                   new='get_provider(provider.STAMEN_TERRAIN_RETINA)')
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='http://tile.stamen.com/terrain/{Z}/{X}/{Y}@2x.png',
            attribution=self._STAMEN_ATTRIBUTION % '<a href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
        )

    @property
    def STAMEN_TONER(self):
        from bokeh.util.deprecation import deprecated
        deprecated(since_or_msg=(1, 1, 0), old='STAMEN_TONER', new='get_provider(ThirdParty.STAMEN_TONER)')
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='http://tile.stamen.com/toner/{Z}/{X}/{Y}.png',
            attribution=self._STAMEN_ATTRIBUTION % '<a href="https://www.openstreetmap.org/copyright">ODbL</a>'
        )

    @property
    def STAMEN_TONER_BACKGROUND(self):
        from bokeh.util.deprecation import deprecated
        deprecated(since_or_msg=(1, 1, 0), old='STAMEN_TONER_BACKGROUND',
                   new='get_provider(ThirdParty.STAMEN_TONER_BACKGROUND)')
        from bokeh.models.tiles import WMTSTileSource
        return WMTSTileSource(
            url='http://tile.stamen.com/toner-background/{Z}/{X}/{Y}.png',
            attribution=self._STAMEN_ATTRIBUTION % '<a href="https://www.openstreetmap.org/copyright">ODbL</a>'
        )

    @property
    def STAMEN_TONER_LABELS(self):
        from bokeh.util.deprecation import deprecated
        deprecated(since_or_msg=(1, 1, 0), old='STAMEN_TONER_LABELS', new='get_provider(ThirdParty.STAMEN_TONER_LABELS)')
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
    'get_provider',
    'ThirdParty'
)
sys.modules['bokeh.tile_providers'] = _mod
del _mod, sys, types
