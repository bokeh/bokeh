import {GestureTool, GestureToolView} from "./gesture_tool"
import {GlyphRenderer} from "../../renderers/glyph_renderer"
import {logger} from "core/logging"
import * as p from "core/properties"
import {clone} from "core/util/object"
import {SelectionGeometry} from "core/bokeh_events"

export class SelectToolView extends GestureToolView

  @getters {
    computed_renderers: () ->
      renderers = @model.renderers
      names = @model.names

      if renderers.length == 0
        all_renderers = @plot_model.plot.renderers
        renderers = (r for r in all_renderers when r instanceof GlyphRenderer)

      if names.length > 0
        renderers = (r for r in renderers when names.indexOf(r.name) >= 0)

      return renderers
  }

  _computed_renderers_by_data_source: () ->
    renderers_by_source = {}
    for r in @computed_renderers
      if !(r.data_source.id of renderers_by_source)
        renderers_by_source[r.data_source.id] = [r]
      else
        renderers_by_source[r.data_source.id] = renderers_by_source[r.data_source.id].concat([r])
    return renderers_by_source

  _keyup: (e) ->
    if e.keyCode == 27
      for r in @computed_renderers
        ds = r.data_source
        sm = ds.selection_manager
        sm.clear()

  _emit_selection_event: (geometry, final=true) ->
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

    @plot_model.plot.trigger_event(new SelectionGeometry({geometry: g, final: final}))

export class SelectTool extends GestureTool

  @define {
    renderers: [ p.Array, [] ]
    names:     [ p.Array, [] ]
  }

  @internal {
    multi_select_modifier: [ p.String, "shift" ]
  }
