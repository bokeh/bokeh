#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
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

# Can be removed in bokeh 2.0
def _make_deprecated_property(name):

    def deprecated_property_tile(self):
        from bokeh.util.deprecation import deprecated
        deprecated(since_or_msg=(1, 1, 0), old=name, new='get_provider(Vendors.%s)' % name)
        return self.get_provider(provider_name=name)
    func = property(deprecated_property_tile)
    return func


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
                          case_sensitive=True)

    def get_provider(self, provider_name):
        from bokeh.models.tiles import WMTSTileSource

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
        else:
            raise ValueError('Can not retrieve attribution for %s' % selected_provider)
        return WMTSTileSource(url=url, attribution=attribution)

    # Properties --------------------------------------------------------------

    # For bokeh 2.0 these can easily be replaced with their corresponding enum values
    CARTODBPOSITRON = _make_deprecated_property(Vendors.CARTODBPOSITRON)
    CARTODBPOSITRON_RETINA = _make_deprecated_property(Vendors.CARTODBPOSITRON_RETINA)
    STAMEN_TERRAIN = _make_deprecated_property(Vendors.STAMEN_TERRAIN)
    STAMEN_TERRAIN_RETINA = _make_deprecated_property(Vendors.STAMEN_TERRAIN_RETINA)
    STAMEN_TONER = _make_deprecated_property(Vendors.STAMEN_TONER)
    STAMEN_TONER_BACKGROUND = _make_deprecated_property(Vendors.STAMEN_TONER_BACKGROUND)
    STAMEN_TONER_LABELS = _make_deprecated_property(Vendors.STAMEN_TONER_LABELS)


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
    'Vendors'
)
sys.modules['bokeh.tile_providers'] = _mod
del _mod, sys, types, _make_deprecated_property
