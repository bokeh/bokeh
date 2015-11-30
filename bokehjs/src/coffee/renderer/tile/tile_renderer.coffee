_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"
wmts = require "./wmts_tile_source"
ImagePool = require "./image_pool"
{logger} = require "../../common/logging"

class TileRendererView extends PlotWidget

  get_extent: () ->
    return [@x_range.get('start'), @y_range.get('start'), @x_range.get('end'), @y_range.get('end')]

  _set_data: () ->
    @pool = new ImagePool()
    @map_plot = @plot_view.model
    @map_canvas = @plot_view.canvas_view.ctx
    @map_frame = @plot_view.frame
    @x_range = @map_plot.get('x_range')
    @x_mapper = this.map_frame.get('x_mappers')['default']
    @y_range = @map_plot.get('y_range')
    @y_mapper = this.map_frame.get('y_mappers')['default']
    @extent = @get_extent()
    @_last_height = undefined
    @_last_width = undefined

  _map_data: () ->
    @initial_extent = @get_extent()
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
    tile_data.loaded = true
    @request_render()

  _on_tile_cache_load: (e) =>
    tile_data = e.target.tile_data
    tile_data.img = e.target
    tile_data.loaded = true

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
      loaded : false
      x_coord : bounds[0]
      y_coord : bounds[3]

    @mget('tile_source').tiles[tile.tile_data.cache_key] = tile.tile_data
    tile.src = @mget('tile_source').get_image_url(x, y, z)
    return tile
  
  _enforce_aspect_ratio: () ->
    # brute force way of handling resize or responsive event -------------------------------------------------------------
    if @_last_height != @map_frame.get('height') or @_last_width != @map_frame.get('width')
      extent = @get_extent()
      zoom_level = @mget('tile_source').get_level_by_extent(extent, @map_frame.get('height'), @map_frame.get('width'))
      new_extent = @mget('tile_source').snap_to_zoom(extent, @map_frame.get('height'), @map_frame.get('width'), zoom_level)
      @x_range.set({start:new_extent[0], end: new_extent[2]})
      @y_range.set({start:new_extent[1], end: new_extent[3]})
      @extent = new_extent
      @_last_height = @map_frame.get('height')
      @_last_width = @map_frame.get('width')
      return true
    return false

  render: (ctx, indices, args) ->

    if not @map_initialized?
      @_set_data()
      @_map_data()
      @map_initialized = true
      
    if @_enforce_aspect_ratio()
      return

    @_update()
    if @prefetch_timer?
      clearTimeout(@prefetch_timer)

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
    l = @plot_view.canvas.vx_to_sx(@map_frame.get('left')) + (outline_width/2)
    t = @plot_view.canvas.vy_to_sy(@map_frame.get('top')) + (outline_width/2)
    w = @map_frame.get('width') - outline_width
    h = @map_frame.get('height') - outline_width
    @map_canvas.rect(l, t, w, h)
    @map_canvas.clip()

  _render_tiles: (tile_keys) ->
    @map_canvas.save()
    @_set_rect()
    @map_canvas.globalAlpha = @mget('alpha')
    for tile_key in tile_keys
      @_draw_tile(tile_key)
    @map_canvas.restore()

  _prefetch_tiles: () =>
    tile_source = @mget('tile_source')
    extent = @get_extent()
    h = @map_frame.get('height')
    w = @map_frame.get('width')
    zoom_level = @mget('tile_source').get_level_by_extent(extent, h, w)
    tiles = @mget('tile_source').get_tiles_by_extent(extent, zoom_level)
    for t in [0..Math.min(10, tiles.length)] by 1
      [x, y, z, bounds] = t
      children = @mget('tile_source').children_by_tile_xyz(x, y, z)
      for c in children
        [cx, cy, cz, cbounds] = c
        if tile_source.tile_xyz_to_key(cx, cy, cz) of tile_source.tiles
          continue
        else
          @_create_tile(cx, cy, cz, cbounds, true)

  _fetch_tiles:(tiles) ->
    for t in tiles
      [x, y, z, bounds] = t
      @_create_tile(x, y, z, bounds)

  _update: () =>
    tile_source = @mget('tile_source')

    min_zoom = tile_source.get('min_zoom')
    max_zoom = tile_source.get('max_zoom')

    tile_source.update()
    extent = @get_extent()
    zooming_out = @extent[2] - @extent[0] < extent[2] - extent[0]
    h = @map_frame.get('height')
    w = @map_frame.get('width')
    zoom_level = tile_source.get_level_by_extent(extent, h, w)
    snap_back = false

    if zoom_level < min_zoom
      extent = @extent
      zoom_level = min_zoom
      snap_back = true

    else if zoom_level > max_zoom
      extent = @extent
      zoom_level = max_zoom
      snap_back = true

    if snap_back
      @plot_model.set({x_range:k})
      @x_range.set(x_range:{start:extent[0], end: extent[2]})
      @y_range.set({start:extent[1], end: extent[3]})
      @extent = extent

    @extent = extent
    tiles = tile_source.get_tiles_by_extent(extent, zoom_level)
    parents = []
    need_load = []
    cached = []
    children = []

    for t in tiles
      [x, y, z, bounds] = t
      if @_is_valid_tile(x, y, z)
        key = tile_source.tile_xyz_to_key(x, y, z)
        tile = tile_source.tiles[key]
        if tile? and tile.loaded == true
          cached.push(key)
        else
          if @mget('render_parents')
            [px, py, pz] = tile_source.get_closest_parent_by_tile_xyz(x, y, z)
            parent_key = tile_source.tile_xyz_to_key(px, py, pz)
            parent_tile = tile_source.tiles[parent_key]
            if parent_tile? and parent_tile.loaded and parent_key not in parents
              parents.push(parent_key)
            if zooming_out
              children = tile_source.children_by_tile_xyz(x, y, z)
              for c in children
                [cx, cy, cz, cbounds] = c
                child_key = tile_source.tile_xyz_to_key(cx, cy, cz)

                if child_key of tile_source.tiles
                  children.push(child_key)

        if not tile?
          need_load.push(t)

    # draw stand-in parents ----------
    @_render_tiles(parents)
    @_render_tiles(children)

    # draw cached ----------
    @_render_tiles(cached)
    for t in cached
      tile_source.tiles[t].current = true

    # fetch missing -------
    if @render_timer?
      clearTimeout(@render_timer)

    @render_timer = setTimeout((=> @_fetch_tiles(need_load)), 65)

class TileRenderer extends HasParent
  default_view: TileRendererView
  type: 'TileRenderer'
  visuals: []
  angles: ['angle']

  defaults: ->
    return _.extend {}, super(), {
      angle: 0
      alpha: 1.0
      x_range_name: "default"
      y_range_name: "default"
      tile_source: new wmts.Model()
      render_parents: true
    }

  display_defaults: ->
    return _.extend {}, super(), {
      level: 'underlay'
    }

module.exports =
  Model: TileRenderer
  View: TileRendererView
