_ = require "underscore"

GestureTool = require "./gesture_tool"
GlyphRenderer = require "../../renderers/glyph_renderer"
{logger} = require "../../../core/logging"
p = require "../../../core/properties"

class SelectToolView extends GestureTool.View

  _keyup: (e) ->
    if e.keyCode == 27
      @model._clear_current_selection()
      @_clear_overlay()

  _clear_overlay: () ->
    # This method should be overwritten by the tool view subclasses
    # to clear the selection overlay (if it exists)
    return null

  _select: (vx, vy, final, append) ->
    # This method should be implemented by the tool view subclasses
    # `vx` and `vy` may be arrays or floats depending on the tool
    return null

class SelectTool extends GestureTool.Model
  default_view: SelectToolView

  @define {
      renderers: [ p.Array, [] ]
      names:     [ p.Array, [] ]
      callback:  [ p.Instance  ]
    }

  _get_selectable_renderers: () ->
    renderers = @renderers
    names = @names
    if renderers.length == 0
      renderers = (r for r in @plot.renderers when r instanceof GlyphRenderer.Model)
    if names.length > 0
      renderers = (r for r in renderers when r.name in names)
    return renderers

  _clear_current_selection: () ->
    selectable_renderers = @_get_selectable_renderers()

    for renderer in _.uniq(selectable_renderers, false, (r) -> r.data_source)
      renderer.data_source.selector.clear()

    return null

  _get_cb_data: (geometry) ->
    g = _.clone(geometry)
    xm = @plot.plot_canvas.frame.x_mappers['default']
    ym = @plot.plot_canvas.frame.y_mappers['default']
    canvas = @plot.plot_canvas.canvas
    if g.type == 'point'
      g.x = xm.map_from_target(g.vx)
      g.y = ym.map_from_target(g.vy)
      g.sx = canvas.vx_to_sx(g.vx)
      g.sy = canvas.vy_to_sy(g.vy)
    else if g.type == 'rect'
      g.x0 = xm.map_from_target(g.vx0)
      g.y0 = ym.map_from_target(g.vy0)
      g.x1 = xm.map_from_target(g.vx1)
      g.y1 = ym.map_from_target(g.vy1)
      g.sx0 = canvas.vx_to_sx(g.vx0)
      g.sy0 = canvas.vy_to_sy(g.vy0)
      g.sx1 = canvas.vx_to_sx(g.vx1)
      g.sy1 = canvas.vy_to_sy(g.vy1)
    else if g.type == 'poly'
      g.x = xm.v_map_from_target(g.vx)
      g.y = ym.v_map_from_target(g.vy)
      g.sx = canvas.v_vx_to_sx(g.vx)
      g.sy = canvas.v_vy_to_sy(g.vy)
    else
      logger.debug("Unrecognized selection geometry type: '#{g.type}'")
    return g

  _save_geometry: (geometry, append) ->
    if append
      geoms = @plot.tool_events.geometries
      geoms.push(geometry)
    else
      geoms = [geometry]

    @plot.tool_events.geometries = geoms
    return null

  _emit_callback: (geometry) ->
    @callback.execute(@, {geometry: geometry})
    return null

module.exports =
  Model: SelectTool
  View: SelectToolView
