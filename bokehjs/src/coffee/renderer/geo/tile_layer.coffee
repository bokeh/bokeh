_ = require "underscore"
Glyph = require "../glyph/glyph"

class TileUtils
  '''
  Mostly direct port of awesome article by Joe Schwartz
  http://msdn.microsoft.com/en-us/library/bb259689.aspx
  '''

  constructor: () ->

    @earth_radius = 6378137
    @min_lat = -85.05112878
    @max_lat = 85.05112878
    @min_lng = -180
    @max_lng = 180

  clip_value: (value, minValue, maxValue) ->
    '''
    Makes sure that value is within a specific range.
    If not, then the lower or upper bounds is returned
    '''
    return Math.min(Math.max(value, minValue), maxValue)

  get_map_dimensions_by_zoom_level: (zoomLevel) ->
    '''
    Returns the width/height in pixels of the entire map
    based on the zoom level.
    '''
    return 256 << zoomLevel

  get_ground_resolution: (latitude, level) ->
    '''
    returns the ground resolution for latitude and zoom level.
    '''
    lat = @clip_value(latitude, @min_lat, @max_lat)
    mapSize = @get_map_dimensions_by_zoom_level(level)
    return Math.cos(lat * Math.PI / 180) * 2 * Math.PI * @earth_radius / mapSize

  get_map_scale: (latitude, level, dpi=96) ->
    '''
    returns the map scale on the dpi of the screen
    '''
    dpm = dpi / 0.0254 #convert to dots per meter
    return @get_ground_resolution(latitude, level) * dpm

  convert_latlng_to_pixelxy: (latitude, longitude, level) ->
    '''
    returns the x,y values of the pixel corresponding to a lat,long.
    '''
    mapSize = @get_map_dimensions_by_zoom_level(level)

    lat = @clip_value(latitude, @min_lat, @max_lat)
    lng = @clip_value(longitude, @min_lng, @max_lng)

    x = (lng + 180) / 360
    sinlat = Math.sin(lat * Math.PI / 180)
    y = 0.5 - Math.log((1 + sinlat) / (1 - sinlat)) / (4 * Math.PI)

    pixelX = Math.floor(@clip_value(x * mapSize + 0.5, 0, mapSize - 1))
    pixelY = Math.floor(@clip_value(y * mapSize + 0.5, 0, mapSize - 1))
    return [pixelX, pixelY]

  convert_pixelxy_to_latlng: (pixelX, pixelY, level) ->
    '''
    converts a pixel x, y to a latitude and longitude.
    '''
    mapSize = @get_map_dimensions_by_zoom_level(level)

    x = (@clip_value(pixelX, 0, mapSize - 1) / mapSize) - 0.5
    y = 0.5 - (@clip_value(pixelY, 0, mapSize - 1) / mapSize)

    lat = 90 - 360 * Math.atan(Math.exp(-y * 2 * Math.PI)) / Math.PI
    lng = 360 * x
    return [lng, lat]

  convert_pixelxy_to_tilexy: (pixelX, pixelY) ->
    '''
    Converts pixel XY coords into tile XY coordinates of the tile containing
    '''
    return [Math.floor(pixelX / 256), Math.floor(pixelY / 256)]

  convert_tilexy_to_pixelxy: (tileX, tileY) ->
    '''
    Converts tile XY coords into pixel XY coordinates of the upper-left pixel
    '''
    return [tileX * 256, tileY * 256]

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

  convert_latlng_to_tilexy: (lng, lat, level) ->
    [pixelX, pixelY] = @convert_latlng_to_pixelxy(lat, lng, level)
    return @convert_pixelxy_to_tilexy(pixelX, pixelY)

  get_tile_origin: (tileX, tileY, level) ->
    '''
    Returns the upper-left hand corner lat/lng for a tile
    '''
    [pixelX, pixelY] = @convert_tilexy_to_pixelxy(tileX, tileY)
    [lng, lat] = @convert_pixelxy_to_latlng(pixelX, pixelY, level)
    return [lat, lng]

class TileLayerView extends Glyph.View

  _index_data: () ->
    @_xy_index()

  _set_data: () ->
    @image = (null for img in @url)
    @need_load = (true for img in @url)
    @loaded = (false for img in @url)
    @_xy_index()

  _map_data: () ->
    @sw = @sdist(@renderer.xmapper, @x, 256, 'edge', @mget('dilate'))
    @sh = @sdist(@renderer.ymapper, @y, 256, 'edge', @mget('dilate'))

  _render: (ctx, indices, {url, image, need_load, sx, sy, sw, sh, angle}) ->
    for i in indices
      if isNaN(sx[i]+sy[i]+angle[i])
        continue

      if need_load[i]
        img = new Image()
        img.onload = do (img, i) =>
          return () =>
            @loaded[i] = true
            image[i] = img
            @renderer.request_render()

        img.src = url[i]
        need_load[i] = false
      else if @loaded[i]
        @_render_image(ctx, i, image[i], sx, sy, 256, 256, angle)

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
  Utils: TileUtils
