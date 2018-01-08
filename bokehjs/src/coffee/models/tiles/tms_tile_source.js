import {MercatorTileSource} from './mercator_tile_source'

export class TMSTileSource extends MercatorTileSource
  type: 'TMSTileSource'

  get_image_url: (x, y, z) ->
    image_url = @string_lookup_replace(@url, @extra_url_vars)
    return image_url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)
