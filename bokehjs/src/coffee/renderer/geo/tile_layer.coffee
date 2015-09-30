_ = require "underscore"
Glyph = require "../glyph/glyph"

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

class Tile

  constructor: (@x, @y, @z, @sw=None, @sh=None) ->

class TileProvider

  constructor: (@url, @tile_size=256) ->
    @utils = new ProjectionUtils()
    @pool = new ImagePool()
    @tiles = {}

  remove_tile: (key) ->
    tile = @tiles[key]
    if tile?
      @pool.push(tile.img)
      delete @tiles[key]

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

    # TODO: handle massive zoom level changed

    for key, tile of @tiles
      tile.retain = tile.current

    for key, tile of @tiles
      if tile.current and not tile.active
        coords = tile.coords
        if not @retain_parent(coords[0], coords[1], coords[2], coords[2] - 5)
          @retain_children(coords[0], coords[1], coords[2], coords[2] + 2)

    for key, tile of @tiles
      if not tile.retain
        @remove_tile(key)

  retain_parent: (x, y, z, min_zoom) ->
    x2 = x // 2
    y2 = y // 2
    z2 = z - 1
    key = @tile_xyz_to_key(x2, y2, z2)
    tile = @tiles[key]

    if tile? and tile.active
      tile.retain = true
      return true

    else if tile? and tile.loaded
      tile.retain = true

    if z2 > min_zoom
      return @retain_parent(x2, y2, z2, min_zoom)

    return false

  retain_children: (x, y, z, max_zoom) ->
    for i in [x * 2...2 * x + 2] by 1
      for j in [y * 2...2 * y + 2] by 1
        key = @tile_xyz_to_key(x, y, z + 1)
        tile = @tiles[key]

        if tile? and tile.active
          tile.retain = true
          continue

        else if tile? and tile.loaded
          tile.retain = true

        if (z + 1 < maxZoom)
          @retain_children(i, j, z + 1, max_zoom)

  update: () ->
    console.warn "Tile Cache Count: " + Object.keys(@tiles).length.toString()
    for key, tile of @tiles
      tile.current = false

class MercatorTileProvider extends TileProvider

  constructor: ->
    super
    @origin_shift = 2 * Math.PI * 6378137 / 2.0
    @initial_resolution = 2 * Math.PI * 6378137 / @tile_size
    @resolutions = (@get_resolution(z) for z in [0..30])

  get_image_url: () ->
    throw Error "Unimplemented Method"

  get_resolution: (level) ->
    return @initial_resolution / Math.pow(2, level)

  get_resolution_by_extent: (extent, height, width) ->
    x_rs = (extent[2] - extent[0]) / width
    y_rs = (extent[3] - extent[1]) / height
    return [x_rs, y_rs]

  get_level_by_extent: (extent, height, width) ->
    x_rs = (extent[2] - extent[0]) / width
    y_rs = (extent[3] - extent[1]) / height
    res = Math.max(x_rs, y_rs)
    i = 0
    for r in @resolutions
      if res > r
        return i
      i += 1

    # closest = @resolutions.reduce (previous, current) ->
    #   return current if (Math.abs(current - res) < Math.abs(previous - res))
    #   return previous
    #
    # return @resolutions.indexOf(closest)

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
    mx = px * res - @origin_shift
    my = py * res - @origin_shift
    return [mx, my]

  meters_to_pixels: (mx, my, level) ->
    res = @get_resolution(level)
    px = (mx + @origin_shift) / res
    py = (my + @origin_shift) / res
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

class TMSTileProvider extends MercatorTileProvider

  get_image_url: (x, y, z) ->
    return @url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)

class WMTSTileProvider extends MercatorTileProvider

  get_image_url: (x, y, z) ->
    [x, y, z] = @tms_to_wmts(x, y, z)
    return @url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)

class QUADKEYTileProvider extends MercatorTileProvider

  get_image_url: (x, y, z) ->
    [x, y, z] = @tms_to_wmts(x, y, z)
    quadKey = @tile_xyz_to_quadkey(x, y, z)
    return @url.replace("{Q}", quadKey)

class TileLayerView extends Glyph.View

  trace: (msg) ->
    console.warn "TileLayerView :: " + msg.toString()

  _create_tile_provider: (provider_type, service_url, tile_size) ->
    return new QUADKEYTileProvider(service_url, tile_size) if(provider_type.toLowerCase() == 'quadkeytileprovider')
    return new TMSTileProvider(service_url, tile_size) if(provider_type.toLowerCase() == 'tmstileprovider')
    return new WMTSTileProvider(service_url, tile_size)

  _index_data: () ->
    @_xy_index()

  get_extent: () ->
    return [@x_range.get('start'), @y_range.get('start'), @x_range.get('end'), @y_range.get('end')]

  _on_dblclick: (e) =>
    extent = @get_extent()
    [xmin, xmax, ymin, ymax] = extent
    zoom_level = @tile_provider.get_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))

    rect = @map_canvas.canvas.getBoundingClientRect()
    x = e.clientX + rect.left
    #TODO: y-dim is not perfect.  zooming doesn't seem completely correct
    y = e.clientY - rect.top - (@map_frame.get('top') - @map_frame.get('height'))
    y = @map_frame.get("height") - y

    x_meters = @x_mapper.map_from_target(e.clientX)
    y_meters = @y_mapper.map_from_target(e.clientY)

    x_offset = Math.abs((@x_range.get('end') - @x_range.get('start')) / 2)
    y_offset = Math.abs((@y_range.get('end') - @y_range.get('start')) / 2)

    updated_extent =  [x_meters - x_offset, y_meters - y_offset, x_meters + x_offset, y_meters + y_offset]

    if e.shiftKey
      zoom_level = zoom_level - 1
    else
      zoom_level = zoom_level + 1

    new_extent = @tile_provider.snap_to_zoom(updated_extent, @map_frame.get('height'), @map_frame.get('width'), zoom_level)
    @x_range.set('start', new_extent[0])
    @y_range.set('start', new_extent[1])
    @x_range.set('end', new_extent[2])
    @y_range.set('end', new_extent[3])

  _set_data: () ->
    @tile_provider = @_create_tile_provider(@mget('tile_provider'), @mget('url'), @mget('tile_size'))
    @pool = new ImagePool()
    @map_plot = @renderer.plot_view.model
    @map_canvas = @renderer.plot_view.canvas_view.ctx
    @map_frame = @renderer.plot_view.frame
    @x_range = @map_plot.get('x_range')
    @x_mapper = this.map_frame.get('x_mappers')['default']
    @y_range = @map_plot.get('y_range')
    @y_mapper = this.map_frame.get('y_mappers')['default']
    @renderer.plot_view.$el.dblclick(@_on_dblclick)


    @initial_extent = [-20037508.34, -20037508.34, 20037508.34, 20037508.34]
    zoom_level = @tile_provider.get_level_by_extent(@initial_extent, @map_frame.get('height'), @map_frame.get('width'))
    new_extent = @tile_provider.snap_to_zoom(@initial_extent, @map_frame.get('height'), @map_frame.get('width'), zoom_level)
    # @x_range.set('start', new_extent[0])
    # @y_range.set('start', new_extent[1])
    # @x_range.set('end', new_extent[2])
    # @y_range.set('end', new_extent[3])

    @x_range.set('start', @initial_extent[0])
    @y_range.set('start', @initial_extent[1])
    @x_range.set('end', @initial_extent[2])
    @y_range.set('end', @initial_extent[3])
    @renderer.plot_view.$el.dblclick(@_on_dblclick)

  _map_data: () ->
    @sw = @sdist(@renderer.xmapper, [0], [@tile_provider.tile_size], 'edge', [true])[0]
    @sh = @sdist(@renderer.ymapper, [0], [@tile_provider.tile_size], 'edge', [true])[0]

  _on_tile_load: (e) =>
    @tile_provider.tiles[e.target.cache_key] = {img: e.target, tile_coords: e.target.tile_coords, bounds: e.target.bounds, current:true}
    @_render_tile(e.target.cache_key)

  _on_tile_cache_load: (e) =>
    @tile_provider.tiles[e.target.cache_key] = {img: e.target, tile_coords: e.target.tile_coords, bounds: e.target.bounds}

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
    tile.src = @tile_provider.get_image_url(x, y, z)
    tile.tile_coords = [x, y, z]
    tile.bounds = bounds
    tile.x_coord = bounds[0]
    tile.y_coord = bounds[3]
    tile.cache_key = @tile_provider.tile_xyz_to_key(x, y, z)
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
    tile_obj = @tile_provider.tiles[tile_key]
    if tile_obj?
      [sxmin, symin] = @renderer.plot_view.frame.map_to_screen([tile_obj.bounds[0]], [tile_obj.bounds[1]], @renderer.plot_view.canvas)
      [sxmax, symax] = @renderer.plot_view.frame.map_to_screen([tile_obj.bounds[2]], [tile_obj.bounds[3]], @renderer.plot_view.canvas)
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
    zoom_level = @tile_provider.get_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))
    tiles = @tile_provider.get_tiles_by_extent(extent, zoom_level)
    for t in [0..Math.min(10, tiles.length)] by 1
      [x, y, z, bounds] = t
      children = @tile_provider.children_by_tile_xyz(x, y, z)
      for c in children
        [cx, cy, cz, cbounds] = c
        if @tile_provider.tile_xyz_to_key(cx, cy, cz) of @tile_provider.tiles
          continue
        else
          @_create_tile(cx, cy, cz, cbounds, true)

  _update: (abridged=false) =>

    if window.stop?
      window.stop()
    else if document.execCommand?
      document.execCommand("Stop", false)

    @tile_provider.update()
    extent = @get_extent()
    zoom_level = @tile_provider.get_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))
    tiles = @tile_provider.get_tiles_by_extent(extent, zoom_level)

    parents = []
    need_load = []
    cached = []

    for t in tiles
      [x, y, z, bounds] = t
      if @_is_valid_tile(x, y, z)
        key = @tile_provider.tile_xyz_to_key(x, y, z)
        if key of @tile_provider.tiles
          cached.push(key)
        else
          [px, py, pz] = @tile_provider.get_closest_parent_by_tile_xyz(x, y, z)
          parent_key = @tile_provider.tile_xyz_to_key(px, py, pz)
          if parent_key of @tile_provider.tiles
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
      @tile_provider.tiles[t].current = true

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
      level: 'glyph'
      tile_provider: "WMTSTileProvider"
      url: "http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png"
      tile_size: 256
      initial_extent: [-180, -90, 180, 90]
    }

module.exports =
  Model: TileLayer
  View: TileLayerView
  TileProvider: TileProvider
  ProjectionUtils: ProjectionUtils
  MercatorTileProvider: MercatorTileProvider
  TMSTileProvider: TMSTileProvider
  WMTSTileProvider: WMTSTileProvider
  QUADKEYTileProvider: QUADKEYTileProvider
