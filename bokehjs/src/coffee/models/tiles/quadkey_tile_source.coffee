import * as MercatorTileSource from './mercator_tile_source'

class QUADKEYTileSource extends MercatorTileSource.Model
  type: 'QUADKEYTileSource'

  get_image_url: (x, y, z) ->
    image_url = @string_lookup_replace(@url, @extra_url_vars)
    [x, y, z] = @tms_to_wmts(x, y, z)
    quadKey = @tile_xyz_to_quadkey(x, y, z)
    return image_url.replace("{Q}", quadKey)

export {
  QUADKEYTileSource as Model
}
