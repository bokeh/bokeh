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
    xm = @plot_view.frame.x_mappers['default']
    ym = @plot_view.frame.y_mappers['default']
    switch g.type
      when 'point'
        g.x = xm.map_from_target(g.vx)
        g.y = ym.map_from_target(g.vy)
      when 'rect'
        g.x0 = xm.map_from_target(g.vx0)
        g.y0 = ym.map_from_target(g.vy0)
        g.x1 = xm.map_from_target(g.vx1)
        g.y1 = ym.map_from_target(g.vy1)
      when 'poly'
        g.x = new Array(g.vx.length)
        g.y = new Array(g.vy.length)
        for i in [0...g.vx.length]
          g.x[i] = xm.map_from_target(g.vx[i])
          g.y[i] = ym.map_from_target(g.vy[i])
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

  initialize: (attrs, options) ->
    super(attrs, options)

    @define_computed_property('computed_renderers',
      () ->
        renderers = @renderers
        names = @names

        if renderers.length == 0
          all_renderers = @plot.renderers
          renderers = (r for r in all_renderers when r instanceof GlyphRenderer)

        if names.length > 0
          renderers = (r for r in renderers when names.indexOf(r.name) >= 0)

        return renderers
      , true)
    @add_dependencies('computed_renderers', this, ['renderers', 'names', 'plot'])
    @add_dependencies('computed_renderers', @plot, ['renderers'])

  @getters {
    computed_renderers: () -> @_get_computed('computed_renderers')
  }
