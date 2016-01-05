''' Pre-configured tile sources with urls and attribution for common 3rd-party tile services.

'''
from .models.tiles import WMTSTileSource

#: Provide toner tiles from http://tile.stamen.com
STAMEN_TONER = WMTSTileSource(
    url='http://tile.stamen.com/toner/{Z}/{X}/{Y}.png',
    attribution=(
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, '
        'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.'
        'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, '
        'under <a href="http://www.openstreetmap.org/copyright">ODbL</a>'
    )
)

#: Provide label tiles from http://tile.stamen.com
STAMEN_TONER_LABELS = WMTSTileSource(
    url='http://tile.stamen.com/toner-labels/{Z}/{X}/{Y}.png',
    attribution=(
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, '
        'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>.'
        'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, '
        'under <a href="http://www.openstreetmap.org/copyright">ODbL</a>'
    )
)

#: Provide terrain tiles from http://tile.stamen.com
STAMEN_TERRAIN = WMTSTileSource(
    url='http://tile.stamen.com/terrain/{Z}/{X}/{Y}.png',
    attribution=(
        'Map tiles by <a href="http://stamen.com">Stamen Design</a>, '
        'under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. '
        'Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under '
        '<a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
    )
)
