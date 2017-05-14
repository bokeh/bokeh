import {GestureTool, GestureToolView} from "./gesture_tool"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {logger} from "core/logging"
import * as p from "core/properties"
import {clone} from "core/util/object"

export class SelectToolView extends GestureToolView

  _keyup: (e) ->
    if e.keyCode == 27
      for r in @model.computed_renderers
        ds = r.data_source
        sm = ds.selection_manager
        sm.clear()

  _save_geometry: (geometry, final, append) ->
    g = clone(geometry)
    xm = @plot_view.frame.xscales['default']
    ym = @plot_view.frame.yscales['default']
    switch g.type
      when 'point'
        g.x = xm.invert(g.vx)
        g.y = ym.invert(g.vy)
      when 'rect'
        g.x0 = xm.invert(g.vx0)
        g.y0 = ym.invert(g.vy0)
        g.x1 = xm.invert(g.vx1)
        g.y1 = ym.invert(g.vy1)
      when 'poly'
        g.x = new Array(g.vx.length)
        g.y = new Array(g.vy.length)
        for i in [0...g.vx.length]
          g.x[i] = xm.invert(g.vx[i])
          g.y[i] = ym.invert(g.vy[i])
      else
        logger.debug("Unrecognized selection geometry type: '#{g.type}'")

    if final
      tool_events = @plot_model.plot.tool_events
      if append
        geoms = tool_events.geometries
        geoms.push(g)
      else
        geoms = [g]

      tool_events.geometries = geoms
    return null

export class SelectTool extends GestureTool

  @define {
    renderers: [ p.Array, [] ]
    names:     [ p.Array, [] ]
  }

  @internal {
    multi_select_modifier: [ p.String, "shift" ]
  }

  connect_signals: () ->
    super()
    # TODO: @connect(@plot.properties.renderers.change, () -> @_computed_renderers = null)
    @connect(@properties.renderers.change,      () -> @_computed_renderers = null)
    @connect(@properties.names.change,          () -> @_computed_renderers = null)
    @connect(@properties.plot.change,           () -> @_computed_renderers = null)

  _compute_renderers: () ->
    renderers = @renderers
    names = @names

    if renderers.length == 0
      all_renderers = @plot.renderers
      renderers = (r for r in all_renderers when r instanceof GlyphRenderer)

    if names.length > 0
      renderers = (r for r in renderers when names.indexOf(r.name) >= 0)

    return renderers

  @getters {
    computed_renderers: () ->
      if not @_computed_renderers? then @_computed_renderers = @_compute_renderers()
      return @_computed_renderers
  }
