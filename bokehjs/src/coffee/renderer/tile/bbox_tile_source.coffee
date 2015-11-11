MercatorTileSource = require('./mercator_tile_source')

class BBoxTileSource extends MercatorTileSource

  type: 'BBoxTileSource'

  get_image_url: (x, y, z) ->
    image_url = @string_lookup_replace(@get('url'), @get('extra_url_vars'))
    [xmin, ymin, xmax, ymax] = @get_tile_meter_bounds(x, y, z)
    return image_url.replace("{XMIN}", xmin).replace("{YMIN}", ymin).replace("{XMAX}", xmax).replace("{YMAX}", ymax)

module.exports =
  Model : BBoxTileSource
