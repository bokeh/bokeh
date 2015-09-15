_ = require "underscore"
Glyph = require "../glyph/glyph"

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

class MercatorTileProvider

  constructor: (@url, @tile_size=256) ->
    @utils = new ProjectionUtils()
    @origin_shift = 2 * Math.PI * 6378137 / 2.0
    @initial_resolution = 2 * Math.PI * 6378137 / @tile_size

  get_image_url: () ->
    throw Error "Unimplemented Method"

  get_resolution: (level) ->
    return @initial_resolution / Math.pow(2, level)

  tms_to_wmts: (x, y, z) ->
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
    [xmin, ymin] = @pixels_to_meters(tx * @tile_size, ty * @tile_size, level)
    [xmax, ymax] = @pixels_to_meters((tx + 1) * @tile_size, (ty + 1) * @tile_size, level)
    return [xmin, ymin, xmax, ymax]

  get_tile_geographic_bounds: (tx, ty, level) ->
    bounds = @get_tile_meter_bounds(tx, ty, level)
    [minLon, minLat, maxLon, maxLat] = @utils.meters_extent_to_geographic(bounds)
    return [minLon, minLat, maxLon, maxLat]

  get_tiles_by_extent: (extent, level) ->
    [xmin, ymin, xmax, ymax] = extent
    [txmin, tymin] = @meters_to_tile(xmin, ymin, level)
    [txmax, tymax] = @meters_to_tile(xmax, ymax, level)

    tiles = []
    for ty in [tymin..tymax] by 1
      for tx in [txmin..txmax] by 1
        tiles.push(@get_image_url(tx, ty, level))

    return tiles

class TMSTileProvider extends MercatorTileProvider

  get_image_url: (x, y, z) ->
    return @url.replace("{X}", x).replace('{Y}', y).replace("{Z}", z)

class WMTSTileProvider extends MercatorTileProvider

  get_tile_meter_bounds: (x, y, z) ->
    [x, y, z] = @tms_to_wmts(x, y, z)
    return super(x, y, z)

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

  _index_data: () ->
    @_xy_index()

  _set_data: () ->
    @need_load = (true for img in @url)
    @loaded = (false for img in @url)

    @_xy_index()

  _map_data: () ->
    @sw = @sdist(@renderer.xmapper, @x, @tile_size, 'edge', @mget('dilate'))
    @sh = @sdist(@renderer.ymapper, @y, @tile_size, 'edge', @mget('dilate'))

  _render: (ctx, indices, {url, image, need_load, sx, sy, sw, sh, angle}) ->
    for i in indices

      if isNaN(sx[i]+sy[i]+angle[i])
        continue

      if need_load[i]
        img = new Image()
        img.onload = do (img, i) =>
          return () =>
            @loaded[i] = true
            @renderer.request_render()

        img.src = url[i]
        need_load[i] = false
      else if @loaded[i]
        @_render_image(ctx, i, image[i], sx, sy, @tile_size, @tile_size, angle)

  _final_sx_sy: (anchor, sx, sy, sw, sh) ->
    switch anchor
      when "top_left"      then [sx       , sy       ]
      when "top_center"    then [sx - sw/2, sy       ]
      when "top_right"     then [sx - sw  , sy       ]
      when "right_center"  then [sx - sw  , sy - sh/2]
      when "bottom_right"  then [sx - sw  , sy - sh  ]
      when "bottom_center" then [sx - sw/2, sy - sh  ]
      when "bottom_left"   then [sx       , sy - sh  ]
      when "left_center"   then [sx       , sy - sh/2]
      when "center"        then [sx - sw/2, sy - sh/2]

  _render_image: (ctx, i, image, sx, sy, sw, sh, angle) ->

    anchor = @mget('anchor') or "top_left"
    [sx, sy] = @_final_sx_sy(anchor, sx[i], sy[i], 256, 256)

    ctx.save()

    ctx.globalAlpha = @mget("global_alpha")

    if angle[i]
      ctx.translate(sx, sy)
      ctx.rotate(angle[i])
      ctx.drawImage(image, 0, 0, 256, 256)
      ctx.rotate(-angle[i])
      ctx.translate(-sx, -sy)
    else
      ctx.drawImage(image, sx, sy, 256, 256)
    ctx.restore()

class TileLayer extends Glyph.Model
  default_view: TileLayerView
  type: 'TileLayer'
  tile_width: 256
  tile_height: 256
  visuals: []
  distances: ['w', 'h']
  angles: ['angle']
  fields: ['url:string']

  defaults: ->
    return _.extend {}, super(), {
      angle: 0
      global_alpha: 1.0
    }

  display_defaults: ->
    return _.extend {}, super(), {
    }

module.exports =
  Model: TileLayer
  View: TileLayerView
  ProjectionUtils: ProjectionUtils
  MercatorTileProvider: MercatorTileProvider
  TMSTileProvider: TMSTileProvider
  WMTSTileProvider: WMTSTileProvider
  QUADKEYTileProvider: QUADKEYTileProvider
