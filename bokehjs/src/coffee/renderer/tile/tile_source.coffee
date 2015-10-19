HasProperties = require "../../common/has_properties"

class ImagePool

  constructor: () ->
    @images = []

  pop: () ->
    img = @images.pop()
    if img?
      return img
    else
      return new Image()

  push: (img) ->

    if @images.length > 50
      return

    if img.constructor == Array
      Array::push.apply(@images, img)
    else
      @images.push(img)

class ProjectionUtils

  constructor: () ->
    @origin_shift = 2 * Math.PI * 6378137 / 2.0

  geographic_to_meters: (xLon, yLat) ->
    mx = xLon * @origin_shift / 180.0
    my = Math.log( Math.tan((90 + yLat) * Math.PI / 360.0 )) / (Math.PI / 180.0)
    my = my * @origin_shift / 180.0
    return [mx, my]

  meters_to_geographic: (mx, my) ->
    lon = (mx / @origin_shift) * 180.0
    lat = (my / @origin_shift) * 180.0
    lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0)
    return [lon, lat]

  geographic_extent_to_meters: (extent) ->
    [xmin, ymin, xmax, ymax] = extent
    [xmin, ymin] = @geographic_to_meters(xmin, ymin)
    [xmax, ymax] = @geographic_to_meters(xmax, ymax)
    return [xmin, ymin, xmax, ymax]

  meters_extent_to_geographic: (extent) ->
    [xmin, ymin, xmax, ymax] = extent
    [xmin, ymin] = @meters_to_geographic(xmin, ymin)
    [xmax, ymax] = @meters_to_geographic(xmax, ymax)
    return [xmin, ymin, xmax, ymax]

class TileSource extends HasProperties

  constructor: (options={}) ->

    @url = options.url ? ''
    @tile_size = options.tile_size ? 256
    @extra_url_vars = options.extra_url_vars ? {}

    # any default for these can be set by subclasses
    @full_extent = options.full_extent
    @x_origin_offset = options.x_origin_offset
    @y_origin_offset = options.y_origin_offset
    @initial_resolution = options.initial_resolution

    @utils = new ProjectionUtils()
    @pool = new ImagePool()
    @tiles = {}
    @max_zoom = 0
    @min_zoom = 30

  string_lookup_replace: (str, lookup) ->
    result_str = str
    for key, value of lookup
      result_str = result_str.replace('{'+key+'}', value.toString())
    return result_str

  update: () ->
    logger.info("Tile Cache Count: " + Object.keys(@tiles).length.toString())
    logger.info("X_ORIGIN_OFFSET: " + @x_origin_offset.toString())
    logger.info("Y_ORIGIN_OFFSET: " + @y_origin_offset.toString())
    for key, tile of @tiles
      tile.current = false
      tile.retain = false

  tile_xyz_to_key: (x, y, z) ->
    key = "#{x}:#{y}:#{z}"
    return key

  key_to_tile_xyz: (key) ->
    return (parseInt(c) for c in key.split(':'))

  sort_tiles_from_center: (tiles, tile_extent) ->
    [txmin, tymin, txmax, tymax] = tile_extent
    center_x = (txmax - txmin) / 2 + txmin
    center_y = (tymax - tymin) / 2 + tymin
    tiles.sort (a, b) ->
      a_distance = Math.sqrt(Math.pow(center_x - a[0], 2) + Math.pow(center_y - a[1], 2))
      b_distance = Math.sqrt(Math.pow(center_x - b[0], 2) + Math.pow(center_y - b[1], 2))
      return a_distance - b_distance
    return tiles

  prune_tiles: () ->
    for key, tile of @tiles
      tile.retain = tile.current or tile.tile_coords[2] < 3 # save the parents...they are cheap
      if tile.current
        @retain_neighbors(tile)
        @retain_children(tile)
        @retain_parents(tile)

    for key, tile of @tiles
      if not tile.retain
        @remove_tile(key)

  remove_tile: (key) ->
    tile = @tiles[key]
    if tile?
      @pool.push(tile.img)
      delete @tiles[key]

  get_image_url: (x, y, z) ->
    image_url = @string_lookup_replace(@url, @extra_url_vars)
    return image_url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)

  retain_neighbors: (reference_tile) ->
    throw Error("Not Implemented")

  retain_parents: (reference_tile) ->
    throw Error("Not Implemented")

  retain_children: (reference_tile) ->
    throw Error("Not Implemented")

  tile_xyz_to_quadkey: (x, y, z) ->
    return "Not Implemented"

  quadkey_to_tile_xyz: (quadkey) ->
    return "Not Implemented"

module.exports =
  TileSource: TileSource
  ProjectionUtils: ProjectionUtils
  ImagePool: ImagePool
