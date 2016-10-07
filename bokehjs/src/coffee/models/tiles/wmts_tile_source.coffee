import {MercatorTileSource} from './mercator_tile_source'

export class WMTSTileSource extends MercatorTileSource
  type: 'WMTSTileSource'

  get_image_url: (x, y, z) ->
    image_url = @string_lookup_replace(@url, @extra_url_vars)
    [x, y, z] = @tms_to_wmts(x, y, z)
    return image_url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)
