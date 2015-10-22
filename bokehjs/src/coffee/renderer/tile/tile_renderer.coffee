_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"
wmts = require "./wmts_tile_source"
ImagePool = require "./image_pool"
{logger} = require "../../common/logging"

class TileRendererView extends PlotWidget

  trace: (msg) ->
    console.warn "TileLayerView :: " + msg.toString()

  get_extent: () ->
    return [@x_range.get('start'), @y_range.get('start'), @x_range.get('end'), @y_range.get('end')]

  _doubletap: (e) =>
    extent = @get_extent()
    [xmin, ymin, xmax, ymax] = extent

    x_percent = (e.bokeh.plot_x - xmin) / (xmax - xmin)
    y_percent = (e.bokeh.plot_y - ymin) / (ymax - ymin)

    zoom_level = @mget('tile_source').get_closest_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))

    if e.srcEvent.shiftKey
      zoom_level = zoom_level - 1
    else
      zoom_level = zoom_level + 1

    new_resolution = @mget('tile_source').resolutions[zoom_level]
    new_xrange = new_resolution * @map_frame.get('width')
    new_yrange = new_resolution * @map_frame.get('height')
    nxmin = e.bokeh.plot_x - (x_percent * new_xrange)
    nymin = e.bokeh.plot_y - (y_percent * new_yrange)
    nxmax = xmin + new_xrange
    nymax = ymin + new_yrange
    new_extent = @mget('tile_source').snap_to_zoom([nxmin, nymin, nxmax, nymax], @map_frame.get('height'), @map_frame.get('width'), zoom_level)
    @x_range.set('start', new_extent[0])
    @y_range.set('start', new_extent[1])
    @x_range.set('end', new_extent[2])
    @y_range.set('end', new_extent[3])

  _set_data: () ->
    @pool = new ImagePool()
    @map_plot = @plot_view.model
    @map_canvas = @plot_view.canvas_view.ctx
    @map_frame = @plot_view.frame
    @x_range = @map_plot.get('x_range')
    @x_mapper = this.map_frame.get('x_mappers')['default']
    @y_range = @map_plot.get('y_range')
    @y_mapper = this.map_frame.get('y_mappers')['default']
    # @renderer.listenTo(@renderer, 'doubletap', @_doubletap)

  _map_data: () ->
    @initial_extent = @get_extent()
    console.dir(@mget('tile_source'))
    console.warn(@mget('tile_source'))
    console.warn(@mget('tile_source'))
    zoom_level = @mget('tile_source').get_level_by_extent(@initial_extent, @map_frame.get('height'), @map_frame.get('width'))
    new_extent = @mget('tile_source').snap_to_zoom(@initial_extent, @map_frame.get('height'), @map_frame.get('width'), zoom_level)
    @x_range.set('start', new_extent[0])
    @y_range.set('start', new_extent[1])
    @x_range.set('end', new_extent[2])
    @y_range.set('end', new_extent[3])

  _on_tile_load: (e) =>
    tile_data = e.target.tile_data
    tile_data.img = e.target
    tile_data.current = true
    @mget('tile_source').tiles[tile_data.cache_key] = tile_data
    @_render_tile(tile_data.cache_key)

  _on_tile_cache_load: (e) =>
    tile_data = e.target.tile_data
    tile_data.img = e.target
    @mget('tile_source').tiles[tile_data.cache_key] = tile_data

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
      quadkey : @mget('tile_source').tile_xyz_to_quadkey(x, y, z)
      cache_key : @mget('tile_source').tile_xyz_to_key(x, y, z)
      bounds : bounds
      x_coord : bounds[0]
      y_coord : bounds[3]

    tile.src = @mget('tile_source').get_image_url(x, y, z)
    return tile

  render: (ctx, indices, args) ->

    if not @map_initialized?
      @_set_data()
      @_map_data()
      @map_initialized = true

    @_update(abridged=true)

    if @render_timer?
      clearTimeout(@render_timer)

    if @prefetch_timer?
      clearTimeout(@prefetch_timer)

    @render_timer = setTimeout(@_update, 65)
    @prefetch_timer = setTimeout(@_prefetch_tiles, 500)

  _draw_tile: (tile_key) ->
    tile_obj = @mget('tile_source').tiles[tile_key]
    if tile_obj?
      [sxmin, symin] = @plot_view.frame.map_to_screen([tile_obj.bounds[0]], [tile_obj.bounds[3]], @plot_view.canvas)
      [sxmax, symax] = @plot_view.frame.map_to_screen([tile_obj.bounds[2]], [tile_obj.bounds[1]], @plot_view.canvas)
      sxmin = sxmin[0]
      symin = symin[0]
      sxmax = sxmax[0]
      symax = symax[0]
      sw = sxmax - sxmin
      sh = symax - symin
      sx = sxmin
      sy = symin
      @map_canvas.drawImage(tile_obj.img, sx, sy, sw, sh)

  _set_rect:() ->
    outline_width = @plot_view.outline_props.width.value()
    @map_canvas.rect(
      @map_frame.get('left') + outline_width/2, @map_frame.get('bottom') - outline_width/2,
      @map_frame.get('width') - outline_width, @map_frame.get('height') - outline_width,
    )


  _render_tile: (tile_key) ->
    @map_canvas.save()
    @_set_rect()
    @map_canvas.clip()
    @_draw_tile(tile_key)
    @map_canvas.restore()

  _render_tiles: (tile_keys) ->
    @map_canvas.save()
    @_set_rect()
    @map_canvas.clip()
    for tile_key in tile_keys
      @_draw_tile(tile_key)
    @map_canvas.restore()

  _prefetch_tiles: () =>
    extent = @get_extent()
    zoom_level = @mget('tile_source').get_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))
    tiles = @mget('tile_source').get_tiles_by_extent(extent, zoom_level)
    for t in [0..Math.min(10, tiles.length)] by 1
      [x, y, z, bounds] = t
      children = @mget('tile_source').children_by_tile_xyz(x, y, z)
      for c in children
        [cx, cy, cz, cbounds] = c
        if @mget('tile_source').tile_xyz_to_key(cx, cy, cz) of @mget('tile_source').tiles
          continue
        else
          @_create_tile(cx, cy, cz, cbounds, true)

  _update: (abridged=false) =>
    @mget('tile_source').update()
    extent = @get_extent()
    zoom_level = @mget('tile_source').get_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))
    tiles = @mget('tile_source').get_tiles_by_extent(extent, zoom_level)

    parents = []
    need_load = []
    cached = []

    for t in tiles
      [x, y, z, bounds] = t
      if @_is_valid_tile(x, y, z)
        key = @mget('tile_source').tile_xyz_to_key(x, y, z)
        if key of @mget('tile_source').tiles
          cached.push(key)
        else
          [px, py, pz] = @mget('tile_source').get_closest_parent_by_tile_xyz(x, y, z)
          parent_key = @mget('tile_source').tile_xyz_to_key(px, py, pz)
          if parent_key of @mget('tile_source').tiles
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
      @mget('tile_source').tiles[t].current = true

    # prune cached tiles ===============================================
    #if not abridged
    #  @tile_source.prune_tiles()

class TileRenderer extends HasParent
  default_view: TileRendererView
  type: 'TileRenderer'
  visuals: []
  angles: ['angle']

  defaults: ->
    return _.extend {}, super(), {
      angle: 0
      global_alpha: 1.0
      x_range_name: "default"
      y_range_name: "default"
      tile_source: new wmts.Model()
    }

  display_defaults: ->
    return _.extend {}, super(), {
      level: 'underlay'
    }

module.exports =
  Model: TileRenderer
  View: TileRendererView
