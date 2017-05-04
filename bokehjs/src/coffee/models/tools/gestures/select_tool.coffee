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

  _computed_renderers_by_data_source: () ->
    renderers_by_source = {}
    for r in @computed_renderers
      if !(r.data_source.id of renderers_by_source)
        renderers_by_source[r.data_source.id] = [r]
      else
        renderers_by_source[r.data_source.id] = renderers_by_source[r.data_source.id].concat([r])
    return renderers_by_source
