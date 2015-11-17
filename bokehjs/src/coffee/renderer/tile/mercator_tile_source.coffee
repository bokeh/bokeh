_ = require "underscore"
TileSource = require "./tile_source"

class MercatorTileSource extends TileSource

  type: 'MercatorTileSource'

  initialize: (options) ->

    super(options)

    @_resolutions = (@get_resolution(z) for z in [0..30])

  _computed_initial_resolution: () ->
    if @get('initial_resolution')?
      @get('initial_resolution')
    else
      # TODO testing 2015-11-17, if this codepath is used it seems
      # to use 100% cpu and wedge Chrome
      2 * Math.PI * 6378137 / @get('tile_size')

  retain_children:(reference_tile) ->
    quadkey = reference_tile.quadkey
    min_zoom = quadkey.length
    max_zoom = min_zoom + 3
    for key, tile of @tiles
      if tile.quadkey.indexOf(quadkey) == 0 and tile.quadkey.length > min_zoom and tile.quadkey.length <= max_zoom
        tile.retain = true

  retain_neighbors:(reference_tile) ->
    neighbor_radius = 4
    [tx, ty, tz] = reference_tile.tile_coords
    neighbor_x = (x for x in [tx - neighbor_radius .. tx + neighbor_radius])
    neighbor_y = (y for y in [ty - neighbor_radius .. ty + neighbor_radius])

    for key, tile of @tiles
      if tile.tile_coords[2] == tz and _.contains(neighbor_x, tile.tile_coords[0]) and _.contains(neighbor_y, tile.tile_coords[1])
        tile.retain = true

  retain_parents:(reference_tile) ->
    quadkey = reference_tile.quadkey
    for key, tile of @tiles
      tile.retain = quadkey.indexOf(tile.quadkey) == 0

  children_by_tile_xyz: (x, y, z) ->
    quad_key = @tile_xyz_to_quadkey(x, y, z)
    child_tile_xyz = []
    for i in [0..3] by 1
      [x, y, z] = @quadkey_to_tile_xyz(quad_key + i.toString())
      b = @get_tile_meter_bounds(x, y, z)
      if b?
        child_tile_xyz.push([x, y, z, b])
    return child_tile_xyz

  parent_by_tile_xyz: (x, y, z) ->
    quad_key = @tile_xyz_to_quadkey(x, y, z)
    parent_quad_key = quad_key.substring(0, quad_key.length - 1)
    return @quadkey_to_tile_xyz(parent_quad_key)

  get_resolution: (level) ->
    return @_computed_initial_resolution() / Math.pow(2, level)

  get_resolution_by_extent: (extent, height, width) ->
    x_rs = (extent[2] - extent[0]) / width
    y_rs = (extent[3] - extent[1]) / height
    return [x_rs, y_rs]

  get_level_by_extent: (extent, height, width) ->
    x_rs = (extent[2] - extent[0]) / width
    y_rs = (extent[3] - extent[1]) / height
    resolution = Math.max(x_rs, y_rs)
    i = 0
    for r in @_resolutions
      if resolution > r
        return 0 if i == 0
        return i - 1 if i > 0
      i += 1

  get_closest_level_by_extent:(extent, height, width) ->
    x_rs = (extent[2] - extent[0]) / width
    y_rs = (extent[3] - extent[1]) / height
    resolution = Math.max(x_rs, y_rs)
    ress = @_resolutions
    closest = @_resolutions.reduce (previous, current) ->
      return current if (Math.abs(current - resolution) < Math.abs(previous - resolution))
      return previous
    return @_resolutions.indexOf(closest)

  snap_to_zoom: (extent, height, width, level) ->
    desired_res = @_resolutions[level]
    desired_x_delta = width * desired_res
    desired_y_delta = height * desired_res

    [xmin, ymin, xmax, ymax] = extent
    x_adjust = (desired_x_delta - (xmax - xmin)) / 2
    y_adjust = (desired_y_delta - (ymax - ymin)) / 2

    return [xmin - x_adjust, ymin - y_adjust, xmax + x_adjust, ymax + y_adjust]

  tms_to_wmts: (x, y, z) ->
    '''Note this works both ways'''
    return [x, 2 ** z - 1 - y, z]

  wmts_to_tms: (x, y, z) ->
    '''Note this works both ways'''
    return [x, 2 ** z - 1 - y, z]

  pixels_to_meters: (px, py, level) ->
    res = @get_resolution(level)
    mx = px * res - @get('x_origin_offset')
    my = py * res - @get('y_origin_offset')
    return [mx, my]

  meters_to_pixels: (mx, my, level) ->
    res = @get_resolution(level)
    px = (mx + @get('x_origin_offset')) / res
    py = (my + @get('y_origin_offset')) / res
    return [px, py]

  pixels_to_tile: (px, py) ->
    tx = Math.max(Math.ceil(px / parseFloat(@get('tile_size'))) - 1, 0)
    ty = Math.max(Math.ceil(py / parseFloat(@get('tile_size'))) - 1, 0)
    return [tx, ty]

  pixels_to_raster: (px, py, level) ->
    mapSize = @get('tile_size') << level
    return [px, mapSize - py]

  meters_to_tile: (mx, my, level) ->
    [px, py] = @meters_to_pixels(mx, my, level)
    return @pixels_to_tile(px, py)

  get_tile_meter_bounds: (tx, ty, level) ->
    # expects tms styles coordinates (bottom-left origin)
    [xmin, ymin] = @pixels_to_meters(tx * @get('tile_size'), ty * @get('tile_size'), level)
    [xmax, ymax] = @pixels_to_meters((tx + 1) * @get('tile_size'), (ty + 1) * @get('tile_size'), level)

    if xmin? and ymin? and xmax? and ymax?
      return [xmin, ymin, xmax, ymax]
    else
      return undefined

  get_tile_geographic_bounds: (tx, ty, level) ->
    bounds = @get_tile_meter_bounds(tx, ty, level)
    [minLon, minLat, maxLon, maxLat] = @utils.meters_extent_to_geographic(bounds)
    return [minLon, minLat, maxLon, maxLat]

  get_tiles_by_extent: (extent, level, tile_border=1) ->
    # unpack extent and convert to tile coordinates
    [xmin, ymin, xmax, ymax] = extent
    [txmin, tymin] = @meters_to_tile(xmin, ymin, level)
    [txmax, tymax] = @meters_to_tile(xmax, ymax, level)

    # add tiles which border
    txmin -= tile_border
    tymin -= tile_border
    txmax += tile_border
    tymax += tile_border

    tiles = []
    for ty in [tymax..tymin] by -1
      for tx in [txmin..txmax] by 1
        tiles.push([tx, ty, level, @get_tile_meter_bounds(tx, ty, level)])
        tiles = @sort_tiles_from_center(tiles, [txmin, tymin, txmax, tymax])
    return tiles

  quadkey_to_tile_xyz: (quadKey) ->
    '''
    Computes tile x, y and z values based on quadKey.
    '''
    tileX = 0
    tileY = 0
    tileZ = quadKey.length
    for i in [tileZ...0] by -1

      value = quadKey.charAt(tileZ - i)
      mask = 1 << (i - 1)

      if value == '0'
        continue

      else if value == '1'
        tileX |= mask

      else if value == '2'
        tileY |= mask

      else if value == '3'
        tileX |= mask
        tileY |= mask

      else
        throw new TypeError("Invalid Quadkey: " + quadKey)

    return [tileX, tileY, tileZ]

  tile_xyz_to_quadkey: (x, y, z) ->
    '''
    Computes quadkey value based on tile x, y and z values.
    '''
    quadKey = ''
    for i in [z...0] by -1
      digit = 0
      mask = 1 << (i - 1)
      if(x & mask) != 0
        digit += 1
      if(y & mask) != 0
        digit += 2
      quadKey += digit.toString()
    return quadKey

  children_by_tile_xyz: (x, y, z) ->
    quad_key = @tile_xyz_to_quadkey(x, y, z)
    child_tile_xyz = []
    for i in [0..3] by 1
      [x, y, z] = @quadkey_to_tile_xyz(quad_key + i.toString())
      b = @get_tile_meter_bounds(x, y, z)
      if b?
        child_tile_xyz.push([x, y, z, b])

    return child_tile_xyz

  parent_by_tile_xyz: (x, y, z) ->
    quad_key = @tile_xyz_to_quadkey(x, y, z)
    parent_quad_key = quad_key.substring(0, quad_key.length - 1)
    return @quadkey_to_tile_xyz(parent_quad_key)

  get_closest_parent_by_tile_xyz: (x, y, z) ->
    quad_key = @tile_xyz_to_quadkey(x, y, z)
    while quad_key.length > 0
      quad_key = quad_key.substring(0, quad_key.length - 1)
      [x, y, z] = @quadkey_to_tile_xyz(quad_key)
      if @tile_xyz_to_key(x, y, z) of @tiles
        return [x, y, z]
    return [0, 0, 0]

  defaults: =>
    return _.extend {}, super(), {
      x_origin_offset : 20037508.34
      y_origin_offset : 20037508.34
      initial_resolution : 156543.03392804097
    }

module.exports = MercatorTileSource
