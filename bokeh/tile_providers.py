'''
Pre-configured tile sources with urls and attribution for common 3rd-party tile services.
Additional information available at:

* Stamen tile service - http://maps.stamen.com/
* CartoDB tile service - https://carto.com/location-data-services/basemaps/
'''
from .models.tiles import WMTSTileSource

#: Tile Source for Stamen Toner Service
STAMEN_TONER = WMTSTileSource(
    url='http://tile.stamen.com/toner/{Z}/{X}/{Y}.png',
    attribution=(
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, '
        'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.'
        'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, '
        'under <a href="http://www.openstreetmap.org/copyright">ODbL</a>'
    )
)

#: Tile Source for Stamen Toner Background Service which does not include labels
STAMEN_TONER_BACKGROUND = WMTSTileSource(
    url='http://tile.stamen.com/toner-background/{Z}/{X}/{Y}.png',
    attribution=(
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, '
        'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.'
        'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, '
        'under <a href="http://www.openstreetmap.org/copyright">ODbL</a>'
    )
)

#: Tile Source for Stamen Toner Service which includes only labels
STAMEN_TONER_LABELS = WMTSTileSource(
    url='http://tile.stamen.com/toner-labels/{Z}/{X}/{Y}.png',
    attribution=(
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, '
        'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.'
        'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, '
        'under <a href="http://www.openstreetmap.org/copyright">ODbL</a>'
    )
)

#: Tile Source for Stamen Terrain Service
STAMEN_TERRAIN = WMTSTileSource(
    url='http://tile.stamen.com/terrain/{Z}/{X}/{Y}.png',
    attribution=(
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, '
        'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. '
        'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under '
        '<a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
    )
)

#: Tile Source for CartoDB Tile Service
CARTODBPOSITRON = WMTSTileSource(
    url='http://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attribution=(
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        ' contributors,'
        '&copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
    )
)

#: Tile Source for CartoDB Tile Service (tiles at 'retina' resolution)
CARTODBPOSITRON_RETINA = WMTSTileSource(
    url='http://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
    attribution=(
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        ' contributors,'
        '&copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
    )
)
