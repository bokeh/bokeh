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

class GridLayer

  constructor: (@url, @tile_size=256) ->
    @utils = new ProjectionUtils()
    @pool = new ImagePool()
    @tiles = {}

  removeTile: (key) ->
    tile = @tiles[key]
    if tile?
      @pool.push(tile.img)
      delete @tiles[key]

  tile_xyz_to_key: (x, y, z) ->
    return x.toString() + ":" + y.toString() + ":" + z.toString()

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

class MercatorTileProvider extends GridLayer

  constructor: ->
    super
    @origin_shift = 2 * Math.PI * 6378137 / 2.0
    @initial_resolution = 2 * Math.PI * 6378137 / @tile_size
    @resolutions = (@get_resolution(z) for z in [0..30])

  get_image_url: () ->
    throw Error "Unimplemented Method"

  get_resolution: (level) ->
    return @initial_resolution / Math.pow(2, level)

  get_level_by_extent: (extent, height, width) ->
    x_rs = (extent[2] - extent[0]) / width
    y_rs = (extent[3] - extent[1]) / height
    res = Math.max(x_rs, y_rs)

    closest = @resolutions.reduce (previous, current) ->
      return current if (Math.abs(current - res) < Math.abs(previous - res))
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
    return [xmin, ymin, xmax, ymax]

  get_tile_geographic_bounds: (tx, ty, level) ->
    bounds = @get_tile_meter_bounds(tx, ty, level)
    [minLon, minLat, maxLon, maxLat] = @utils.meters_extent_to_geographic(bounds)
    return [minLon, minLat, maxLon, maxLat]

  get_tiles_by_extent: (extent, level, tile_border=2) ->

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

class TMSTileProvider extends MercatorTileProvider

  get_image_url: (x, y, z) ->
    return @url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)

class WMTSTileProvider extends MercatorTileProvider

  get_image_url: (x, y, z) ->
    [x, y, z] = @tms_to_wmts(x, y, z)
    return @url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)

class QUADKEYTileProvider extends MercatorTileProvider

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

  get_image_url: (x, y, z) ->
    [x, y, z] = @tms_to_wmts(x, y, z)
    quadKey = @tile_xyz_to_quadkey(x, y, z)
    return @url.replace("{QUADKEY}", quadKey)



class TileLayerView extends Glyph.View

  trace: (msg) ->
    console.warn "TileLayerView :: " + msg.toString()

  _create_tile_provider: (provider_type, service_url, tile_size) ->
    return new QUADKEYTileProvider(service_url, tile_size) if(provider_type.toLowerCase() == 'quadkeytileprovider')
    return new TMSTileProvider(service_url, tile_size) if(provider_type.toLowerCase() == 'tmstileprovider')
    return new WMTSTileProvider(service_url, tile_size)

  _index_data: () ->
    @trace("._index_data()")
    @_xy_index()

  get_extent: () ->
    return [@x_range.get('start'), @y_range.get('start'), @x_range.get('end'), @y_range.get('end')]

  _on_dblclick: (e) =>
    extent = @get_extent()
    [xmin, xmax, ymin, ymax] = extent
    zoom_level = @tile_provider.get_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))

    rect = @map_canvas.canvas.getBoundingClientRect()
    x = e.clientX - rect.left
    #TODO: y-dim is not perfect.  zooming doesn't seem completely correct
    y = e.clientY - rect.top - (@map_frame.get('top') - @map_frame.get('height'))
    y = @map_frame.get("height") - y

    x_meters = @x_mapper.map_from_target(x)
    y_meters = @y_mapper.map_from_target(y)

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
    @trace("._set_data()")
    @tile_provider = @_create_tile_provider(@provider_type[0], @url[0], @tile_size[0])
    @pool = new ImagePool()
    @initial_extent = [-20037508.34, -20037508.34, 20037508.34, 20037508.34]
    @map_plot = @renderer.plot_view.model
    @map_canvas = @renderer.plot_view.canvas_view.ctx
    @map_frame = @renderer.plot_view.frame

    @x_range = @map_plot.get('x_range')
    @x_mapper = this.map_frame.get('x_mappers')['default']

    @y_range = @map_plot.get('y_range')
    @y_mapper = this.map_frame.get('y_mappers')['default']

    @x_range.set('start', @initial_extent[0])
    @y_range.set('start', @initial_extent[1])
    @x_range.set('end', @initial_extent[2])
    @y_range.set('end', @initial_extent[3])

    @renderer.plot_view.$el.dblclick(@_on_dblclick)

  _map_data: () ->
    @trace("._map_data()")
    @sw = @sdist(@renderer.xmapper, @x, @mget('tile_size'), 'edge', @mget('dilate'))
    @sh = @sdist(@renderer.ymapper, @y, @mget('tile_size'), 'edge', @mget('dilate'))

  _on_tile_load: (e) =>
    @tile_provider.tiles[e.target.cache_key] = {img: e.target, tile_coords: e.target.tile_coords, bounds: e.target.bounds, current: true}
    @_render_tile(e.target.cache_key)

  _on_tile_error: (e) =>
    @trace("._on_tile_error()")
    return ''

  _is_valid_tile: (x, y, z) ->

    #is tile currently on screen?
    return true

  _create_tile: (x, y, z, bounds) ->
    tile = @pool.pop()
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
    @_update()

  _render_tile: (tile_key) ->
    tile_obj = @tile_provider.tiles[tile_key]
    if tile_obj?
      @map_canvas.save()
      [sx, sy] = @renderer.plot_view.frame.map_to_screen([tile_obj.bounds[0]], [tile_obj.bounds[3]], @renderer.plot_view.canvas)
      @map_canvas.rect(
        @map_frame.get('left')+1, @map_frame.get('bottom')+2,
        @map_frame.get('width')-2, @map_frame.get('height'),
      )
      @map_canvas.clip()
      @map_canvas.drawImage(tile_obj.img, sx[0], sy[0], 256, 256)
      @map_canvas.restore()

  _update: () =>
    if window.stop?
      window.stop()
    else if document.execCommand?
      document.execCommand("Stop", false)

    @trace("._render()")
    extent = @get_extent()
    zoom_level = @tile_provider.get_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))
    new_extent = @tile_provider.snap_to_zoom(extent, @map_frame.get('height'), @map_frame.get('width'), zoom_level)

    @x_range.set('start', new_extent[0])
    @y_range.set('start', new_extent[1])
    @x_range.set('end', new_extent[2])
    @y_range.set('end', new_extent[3])
    tiles = @tile_provider.get_tiles_by_extent(new_extent, zoom_level)

    for t in tiles
      [x, y, z, bounds] = t
      if @_is_valid_tile(x, y, z)
        key = @tile_provider.tile_xyz_to_key(x, y, z)
        if key of @tile_provider.tiles
          @_render_tile(key)
        else
          @_create_tile(x, y, z, bounds)

class TileLayer extends Glyph.Model
  default_view: TileLayerView
  type: 'TileLayer'
  visuals: []
  distances: ['w', 'h']
  angles: ['angle']
  fields: ['url:string', 'provider_type:string', 'tile_size']

  defaults: ->
    return _.extend {}, super(), {
      angle: 0
      tile_size: 256
      global_alpha: 1.0
    }

  display_defaults: ->
    return _.extend {}, super(), {
      level: 'glyph'
    }

module.exports =
  Model: TileLayer
  View: TileLayerView
  GridLayer: GridLayer
  ProjectionUtils: ProjectionUtils
  MercatorTileProvider: MercatorTileProvider
  TMSTileProvider: TMSTileProvider
  WMTSTileProvider: WMTSTileProvider
  QUADKEYTileProvider: QUADKEYTileProvider
