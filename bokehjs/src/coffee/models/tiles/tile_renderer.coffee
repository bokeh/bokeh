import {ImagePool} from "./image_pool"
import {WMTSTileSource} from "./wmts_tile_source"
import {Renderer, RendererView} from "../renderers/renderer"
import {div} from "core/dom"
import * as p from "core/properties"
import {isString} from "core/util/types"

export class TileRendererView extends RendererView

  initialize: (options) ->
    @attributionEl = null
    @_tiles = []
    super

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @request_render())

  get_extent: () ->
    return [@x_range.start, @y_range.start, @x_range.end, @y_range.end]

  _set_data: () ->
    @pool = new ImagePool()
    @map_plot = @plot_model.plot
    @map_canvas = @plot_view.canvas_view.ctx
    @map_frame = @plot_model.frame
    @x_range = @map_plot.x_range
    @y_range = @map_plot.y_range
    @extent = @get_extent()
    @_last_height = undefined
    @_last_width = undefined

  _add_attribution: () =>
    attribution = @model.tile_source.attribution

    if isString(attribution) and attribution.length > 0
      if not @attributionEl?
        border_width = @map_plot.outline_line_width
        bottom_offset = @map_plot.min_border_bottom + border_width
        right_offset = @map_frame._right.value - @map_frame._width.value
        max_width = @map_frame._width.value - border_width
        @attributionEl = div({
          class: 'bk-tile-attribution'
          style: {
            position: 'absolute'
            bottom: "#{bottom_offset}px"
            right: "#{right_offset}px"
            'max-width': "#{max_width}px"
            'background-color': 'rgba(255,255,255,0.8)'
            'font-size': '9pt'
            'font-family': 'sans-serif'
          }
        })

        overlays = @plot_view.canvas_view.events_el
        overlays.appendChild(@attributionEl)

      @attributionEl.innerHTML = attribution

  _map_data: () ->
    @initial_extent = @get_extent()
    zoom_level = @model.tile_source.get_level_by_extent(@initial_extent, @map_frame._height.value, @map_frame._width.value)
    new_extent = @model.tile_source.snap_to_zoom(@initial_extent, @map_frame._height.value, @map_frame._width.value, zoom_level)
    @x_range.start = new_extent[0]
    @y_range.start = new_extent[1]
    @x_range.end = new_extent[2]
    @y_range.end = new_extent[3]
    @_add_attribution()

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
    tile_data.finished = true
    @notify_finished()

  _on_tile_error: (e) =>
    tile_data = e.target.tile_data
    tile_data.finished = true

  _create_tile: (x, y, z, bounds, cache_only=false) ->
    normalized_coords = @model.tile_source.normalize_xyz(x, y, z)
    tile = @pool.pop()

    if cache_only
      tile.onload = @_on_tile_cache_load
    else
      tile.onload = @_on_tile_load

    tile.onerror = @_on_tile_error
    tile.alt = ''

    tile.tile_data = {
      tile_coords : [x, y, z]
      normalized_coords : normalized_coords
      quadkey : @model.tile_source.tile_xyz_to_quadkey(x, y, z)
      cache_key : @model.tile_source.tile_xyz_to_key(x, y, z)
      bounds : bounds
      loaded : false
      finished : false
      x_coord : bounds[0]
      y_coord : bounds[3]
    }

    @model.tile_source.tiles[tile.tile_data.cache_key] = tile.tile_data
    tile.src = @model.tile_source.get_image_url(normalized_coords...)

    @_tiles.push(tile)
    return tile

  _enforce_aspect_ratio: () ->
    # brute force way of handling resize or sizing_mode event -------------------------------------------------------------
    if @_last_height != @map_frame._height.value or @_last_width != @map_frame._width.value
      extent = @get_extent()
      zoom_level = @model.tile_source.get_level_by_extent(extent, @map_frame._height.value, @map_frame._width.value)
      new_extent = @model.tile_source.snap_to_zoom(extent, @map_frame._height.value, @map_frame._width.value, zoom_level)
      @x_range.setv({start:new_extent[0], end: new_extent[2]})
      @y_range.setv({start:new_extent[1], end: new_extent[3]})
      @extent = new_extent
      @_last_height = @map_frame._height.value
      @_last_width = @map_frame._width.value
      return true
    return false

  has_finished: () ->
    if not super()
      return false

    if @_tiles.length == 0
      return false

    for tile in @_tiles
      if not tile.tile_data.finished
        return false

    return true

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

    if @has_finished()
      @notify_finished()

  _draw_tile: (tile_key) ->
    tile_obj = @model.tile_source.tiles[tile_key]
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
    outline_width = @plot_model.plot.properties.outline_line_width.value()
    l = @plot_view.canvas.vx_to_sx(@map_frame._left.value) + (outline_width/2)
    t = @plot_view.canvas.vy_to_sy(@map_frame._top.value) + (outline_width/2)
    w = @map_frame._width.value - outline_width
    h = @map_frame._height.value - outline_width
    @map_canvas.rect(l, t, w, h)
    @map_canvas.clip()

  _render_tiles: (tile_keys) ->
    @map_canvas.save()
    @_set_rect()
    @map_canvas.globalAlpha = @model.alpha
    for tile_key in tile_keys
      @_draw_tile(tile_key)
    @map_canvas.restore()

  _prefetch_tiles: () =>
    tile_source = @model.tile_source
    extent = @get_extent()
    h = @map_frame._height.value
    w = @map_frame._width.value
    zoom_level = @model.tile_source.get_level_by_extent(extent, h, w)
    tiles = @model.tile_source.get_tiles_by_extent(extent, zoom_level)
    for t in [0..Math.min(10, tiles.length)] by 1
      [x, y, z, bounds] = t
      children = @model.tile_source.children_by_tile_xyz(x, y, z)
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
    tile_source = @model.tile_source

    min_zoom = tile_source.min_zoom
    max_zoom = tile_source.max_zoom

    tile_source.update()
    extent = @get_extent()
    zooming_out = @extent[2] - @extent[0] < extent[2] - extent[0]
    h = @map_frame._height.value
    w = @map_frame._width.value
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
      @x_range.setv(x_range:{start:extent[0], end: extent[2]})
      @y_range.setv({start:extent[1], end: extent[3]})
      @extent = extent

    @extent = extent
    tiles = tile_source.get_tiles_by_extent(extent, zoom_level)
    parents = []
    need_load = []
    cached = []
    children = []

    for t in tiles
      [x, y, z, bounds] = t
      key = tile_source.tile_xyz_to_key(x, y, z)
      tile = tile_source.tiles[key]
      if tile? and tile.loaded == true
        cached.push(key)
      else
        if @model.render_parents
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

export class TileRenderer extends Renderer
  default_view: TileRendererView
  type: 'TileRenderer'

  @define {
      alpha:          [ p.Number,   1.0              ]
      x_range_name:   [ p.String,   "default"        ]
      y_range_name:   [ p.String,   "default"        ]
      tile_source:    [ p.Instance, () -> new WMTSTileSource() ]
      render_parents: [ p.Bool,     true             ]
    }

  @override {
    level: 'underlay'
  }
