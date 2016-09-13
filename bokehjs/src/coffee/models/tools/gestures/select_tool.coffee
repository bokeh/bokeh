_ = require "underscore"

GestureTool = require "./gesture_tool"
GlyphRenderer = require "../../renderers/glyph_renderer"
{logger} = require "../../../core/logging"
p = require "../../../core/properties"

class SelectToolView extends GestureTool.View

  _keyup: (e) ->
    if e.keyCode == 27
      @model._clear_current_selection()

  _get_cb_data: (geometry) ->
    g = _.clone(geometry)
    xm = @plot_view.frame.x_mappers['default']
    ym = @plot_view.frame.y_mappers['default']
    canvas = @plot_view.canvas
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
    tool_events = @plot_model.plot.tool_events

    if append
      geoms = tool_events.geometries
      geoms.push(geometry)
    else
      geoms = [geometry]

    tool_events.geometries = geoms
    return null

  _emit_callback: (geometry) ->
    @model.callback.execute(@model, {geometry: geometry})
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
      renderer.data_source.selection_manager.clear()

    return null

module.exports =
  Model: SelectTool
  View: SelectToolView
