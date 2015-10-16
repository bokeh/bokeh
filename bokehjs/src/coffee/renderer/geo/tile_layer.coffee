_ = require "underscore"
Glyph = require "../glyph/glyph"
{logger} = require "../../common/logging"

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

class Helpers

  @string_lookup_replace: (str, lookup) ->
    result_str = str
    for key, value of lookup
      result_str = result_str.replace('{'+key+'}', value.toString())
    return result_str

class TileSource

  constructor: (options={}) ->

    @url = options.url ? ''
    @tile_size = options.tile_size ? 256
    @full_extent = options.full_extent ? [-20037508.34, -20037508.34, 20037508.34, 20037508.34]
    @extra_url_vars = options.extra_url_vars ? {}
    @x_origin_offset = options.x_origin_offset ? 20037508.34
    @y_origin_offset = options.y_origin_offset ? 20037508.34

    @utils = new ProjectionUtils()
    @pool = new ImagePool()
    @tiles = {}
    @max_zoom = 0
    @min_zoom = 30

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
    image_url = Helpers.string_lookup_replace(@url, @extra_url_vars)
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

class MercatorTileSource extends TileSource

  constructor: ->
    super
    @origin_shift = 2 * Math.PI * 6378137 / 2.0
    @initial_resolution = 2 * Math.PI * 6378137 / @tile_size
    @resolutions = (@get_resolution(z) for z in [0..30])

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
    return @initial_resolution / Math.pow(2, level)

  get_resolution_by_extent: (extent, height, width) ->
    x_rs = (extent[2] - extent[0]) / width
    y_rs = (extent[3] - extent[1]) / height
    return [x_rs, y_rs]

  get_level_by_extent: (extent, height, width) ->
    x_rs = (extent[2] - extent[0]) / width
    y_rs = (extent[3] - extent[1]) / height
    resolution = Math.max(x_rs, y_rs)
    i = 0
    for r in @resolutions
      if resolution > r
        return 0 if i == 0
        return i - 1 if i > 0
      i += 1

  get_closest_level_by_extent:(extent, height, width) ->
    x_rs = (extent[2] - extent[0]) / width
    y_rs = (extent[3] - extent[1]) / height
    resolution = Math.max(x_rs, y_rs)
    closest = @resolutions.reduce (previous, current) ->
      return current if (Math.abs(current - resolution) < Math.abs(previous - resolution))
      return previous
    return @resolutions.indexOf(closest)

  snap_to_zoom: (extent, height, width, level) ->
    desired_res = @resolutions[level]
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
    mx = px * res - @x_origin_offset
    my = py * res - @y_origin_offset
    return [mx, my]

  meters_to_pixels: (mx, my, level) ->
    res = @get_resolution(level)
    px = (mx + @x_origin_offset) / res
    py = (my + @y_origin_offset) / res
    return [px, py]

  pixels_to_tile: (px, py) ->
    tx = Math.max(Math.ceil(px / parseFloat(@tile_size)) - 1, 0)
    ty = Math.max(Math.ceil(py / parseFloat(@tile_size)) - 1, 0)
    return [tx, ty]

  pixels_to_raster: (px, py, level) ->
    mapSize = @tile_size << level
    return [px, mapSize - py]

  meters_to_tile: (mx, my, level) ->
    [px, py]= @meters_to_pixels(mx, my, level)
    return @pixels_to_tile(px, py)

  get_tile_meter_bounds: (tx, ty, level) ->
    # expects tms styles coordinates (bottom-left origin)
    [xmin, ymin] = @pixels_to_meters(tx * @tile_size, ty * @tile_size, level)
    [xmax, ymax] = @pixels_to_meters((tx + 1) * @tile_size, (ty + 1) * @tile_size, level)

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

class TMSTileSource extends MercatorTileSource

  get_image_url: (x, y, z) ->
    image_url = Helpers.string_lookup_replace(@url, @extra_url_vars)
    return image_url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)

class WMTSTileSource extends MercatorTileSource

  get_image_url: (x, y, z) ->
    image_url = Helpers.string_lookup_replace(@url, @extra_url_vars)
    [x, y, z] = @tms_to_wmts(x, y, z)
    return image_url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)

class QUADKEYTileSource extends MercatorTileSource

  get_image_url: (x, y, z) ->
    image_url = Helpers.string_lookup_replace(@url, @extra_url_vars)
    [x, y, z] = @tms_to_wmts(x, y, z)
    quadKey = @tile_xyz_to_quadkey(x, y, z)
    return image_url.replace("{Q}", quadKey)

class TileLayerView extends Glyph.View

  trace: (msg) ->
    console.warn "TileLayerView :: " + msg.toString()

  get_extent: () ->
    return [@x_range.get('start'), @y_range.get('start'), @x_range.get('end'), @y_range.get('end')]

  _doubletap: (e) =>
    extent = @get_extent()
    [xmin, ymin, xmax, ymax] = extent

    x_percent = (e.bokeh.plot_x - xmin) / (xmax - xmin)
    y_percent = (e.bokeh.plot_y - ymin) / (ymax - ymin)

    zoom_level = @tile_source.get_closest_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))

    if e.srcEvent.shiftKey
      zoom_level = zoom_level - 1
    else
      zoom_level = zoom_level + 1

    new_resolution = @tile_source.resolutions[zoom_level]
    new_xrange = new_resolution * @map_frame.get('width')
    new_yrange = new_resolution * @map_frame.get('height')
    nxmin = e.bokeh.plot_x - (x_percent * new_xrange)
    nymin = e.bokeh.plot_y - (y_percent * new_yrange)
    nxmax = xmin + new_xrange
    nymax = ymin + new_yrange
    new_extent = @tile_source.snap_to_zoom([nxmin, nymin, nxmax, nymax], @map_frame.get('height'), @map_frame.get('width'), zoom_level)
    @x_range.set('start', new_extent[0])
    @y_range.set('start', new_extent[1])
    @x_range.set('end', new_extent[2])
    @y_range.set('end', new_extent[3])

  _create_tile_source: () ->

    tile_options =
      url : @mget('url')
      tile_size : @mget('tile_size')
      x_origin_offset : @mget('x_origin_offset')
      y_origin_offset : @mget('y_origin_offset')
      extra_url_vars : @mget('extra_url_vars')
      initial_resolution : @mget('initial_resolution')

    if source_type.toLowerCase() == 'quadkeytilesource'
      return new QUADKEYTileSource(tile_options)

    if source_type.toLowerCase() == 'tmstilesource'
      return new TMSTileSource(tile_options)

    if source_type.toLowerCase() == 'wmtstilesource'
      return new WMTSTileSource(tile_options)

    throw Error("Source Type #{source_type} not among valid tile source types (e.g. QUADKEYTileSource, TMSTileSource, WMTSTileSource)")


  _index_data: () ->
    @_xy_index()

  _set_data: () ->
    @tile_source = @_create_tile_source()

    @pool = new ImagePool()
    @map_plot = @renderer.plot_view.model
    @map_canvas = @renderer.plot_view.canvas_view.ctx
    @map_frame = @renderer.plot_view.frame
    @x_range = @map_plot.get('x_range')
    @x_mapper = this.map_frame.get('x_mappers')['default']
    @y_range = @map_plot.get('y_range')
    @y_mapper = this.map_frame.get('y_mappers')['default']
    @renderer.listenTo(@renderer, 'doubletap', @_doubletap)

  _map_data: () ->
    if not @map_initialized?
      @initial_extent = @get_extent()
      zoom_level = @tile_source.get_level_by_extent(@initial_extent, @map_frame.get('height'), @map_frame.get('width'))
      new_extent = @tile_source.snap_to_zoom(@initial_extent, @map_frame.get('height'), @map_frame.get('width'), zoom_level)
      @x_range.set('start', new_extent[0])
      @y_range.set('start', new_extent[1])
      @x_range.set('end', new_extent[2])
      @y_range.set('end', new_extent[3])
      @map_initialized = true

  _on_tile_load: (e) =>
    tile_data = e.target.tile_data
    tile_data.img = e.target
    tile_data.current = true
    @_render_tile(tile_data.cache_key)

    @tile_source.tiles[tile_data.cache_key] = tile_data

  _on_tile_cache_load: (e) =>
    tile_data = e.target.tile_data
    tile_data.img = e.target
    @tile_source.tiles[tile_data.cache_key] = tile_data

  _on_tile_error: (e) =>
    return ''

  _is_valid_tile: (x, y, z) ->

    if y < 0 || y > 1 << z || x < 0 || x > 1 << z
      return false

    return true

  _create_tile: (x, y, z, bounds, cache_only=false) ->
    tile = @pool.pop()

    if cache_only
      tile.onload = @_on_tile_cache_load
    else
      tile.onload = @_on_tile_load

    tile.onerror = @_on_tile_error
    tile.alt = ''
    
    tile.tile_data =
      tile_coords : [x, y, z]
      quadkey : @tile_source.tile_xyz_to_quadkey(x, y, z)
      cache_key : @tile_source.tile_xyz_to_key(x, y, z)
      bounds : bounds
      x_coord : bounds[0]
      y_coord : bounds[3]

    tile.src = @tile_source.get_image_url(x, y, z)
    return tile

  _render: (ctx, indices, {url, image, need_load, sx, sy, sw, sh, angle}) ->

    @_update(abridged=true)

    if @render_timer?
      clearTimeout(@render_timer)

    if @prefetch_timer?
      clearTimeout(@prefetch_timer)

    @render_timer = setTimeout(@_update, 65)
    @prefetch_timer = setTimeout(@_prefetch_tiles, 500)

  _draw_tile: (tile_key) ->
    tile_obj = @tile_source.tiles[tile_key]
    if tile_obj?
      [sxmin, symin] = @renderer.plot_view.frame.map_to_screen([tile_obj.bounds[0]], [tile_obj.bounds[3]], @renderer.plot_view.canvas)
      [sxmax, symax] = @renderer.plot_view.frame.map_to_screen([tile_obj.bounds[2]], [tile_obj.bounds[1]], @renderer.plot_view.canvas)
      sxmin = sxmin[0]
      symin = symin[0]
      sxmax = sxmax[0]
      symax = symax[0]
      sw = sxmax - sxmin
      sh = symax - symin
      sx = sxmin
      sy = symin
      @map_canvas.drawImage(tile_obj.img, sx, sy, sw, sh)

  _render_tile: (tile_key) ->
    @map_canvas.save()
    @map_canvas.rect(
      @map_frame.get('left')+1, @map_frame.get('bottom')+2,
      @map_frame.get('width')-2, @map_frame.get('height'),
    )
    @map_canvas.clip()
    @_draw_tile(tile_key)
    @map_canvas.restore()

  _render_tiles: (tile_keys) ->
    @map_canvas.save()
    @map_canvas.rect(
      @map_frame.get('left')+1, @map_frame.get('bottom')+2,
      @map_frame.get('width')-2, @map_frame.get('height'),
    )
    @map_canvas.clip()
    for tile_key in tile_keys
      @_draw_tile(tile_key)
    @map_canvas.restore()

  _prefetch_tiles: () =>
    extent = @get_extent()
    zoom_level = @tile_source.get_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))
    tiles = @tile_source.get_tiles_by_extent(extent, zoom_level)
    for t in [0..Math.min(10, tiles.length)] by 1
      [x, y, z, bounds] = t
      children = @tile_source.children_by_tile_xyz(x, y, z)
      for c in children
        [cx, cy, cz, cbounds] = c
        if @tile_source.tile_xyz_to_key(cx, cy, cz) of @tile_source.tiles
          continue
        else
          @_create_tile(cx, cy, cz, cbounds, true)

  _update: (abridged=false) =>
    @tile_source.update()
    extent = @get_extent()
    zoom_level = @tile_source.get_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))
    tiles = @tile_source.get_tiles_by_extent(extent, zoom_level)

    parents = []
    need_load = []
    cached = []

    for t in tiles
      [x, y, z, bounds] = t
      if @_is_valid_tile(x, y, z)
        key = @tile_source.tile_xyz_to_key(x, y, z)
        if key of @tile_source.tiles
          cached.push(key)
        else
          [px, py, pz] = @tile_source.get_closest_parent_by_tile_xyz(x, y, z)
          parent_key = @tile_source.tile_xyz_to_key(px, py, pz)
          if parent_key of @tile_source.tiles
            parents.push(parent_key)
          need_load.push(t)

    # first draw stand-in parents =====================================
    @_render_tiles(parents)

    # load missing tiles ==============================================
    if not abridged
      for t in need_load
        [x, y, z, bounds] = t
        @_create_tile(x, y, z, bounds)

    # draw cached tiles ===============================================
    @_render_tiles(cached)
    for t in cached
      @tile_source.tiles[t].current = true

    # prune cached tiles ===============================================
    #if not abridged
    #  @tile_source.prune_tiles()

class TileLayer extends Glyph.Model
  default_view: TileLayerView
  type: 'TileLayer'
  visuals: []
  distances: ['w', 'h']
  angles: ['angle']

  defaults: ->
    return _.extend {}, super(), {
      angle: 0
      global_alpha: 1.0
    }

  display_defaults: ->
    return _.extend {}, super(), {
      tile_source: "WMTSTileSource"
      url: "http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png"
      tile_size: 256
      min_zoom:0
      max_zoom:30
      x_origin_offset:20037508.34
      y_origin_offset:20037508.34
      extra_url_vars:{}
      initial_resolution:2 * Math.PI * 6378137 / 256
    }

module.exports =
  Model: TileLayer
  View: TileLayerView
  TileSource: TileSource
  ProjectionUtils: ProjectionUtils
  MercatorTileSource: MercatorTileSource
  TMSTileSource: TMSTileSource
  WMTSTileSource: WMTSTileSource
  QUADKEYTileSource: QUADKEYTileSource
