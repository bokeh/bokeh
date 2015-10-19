mercator_tile_source = require('./mercator_tile_source')

class TMSTileSource extends mercator_tile_source.MercatorTileSource

  get_image_url: (x, y, z) ->
    image_url = @string_lookup_replace(@url, @extra_url_vars)
    return image_url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)

module.exports =
  TMSTileSource: TMSTileSource
