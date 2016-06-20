_ = require "underscore"

GestureTool = require "./gesture_tool"
GlyphRenderer = require "../../renderers/glyph_renderer"
{logger} = require "../../../core/logging"
p = require "../../../core/properties"

class SelectToolView extends GestureTool.View

  _keyup: (e) ->
    if e.keyCode == 27
      for r in @mget('computed_renderers')
        ds = r.get('data_source')
        sm = ds.get('selection_manager')
        sm.clear()

  _save_geometry: (geometry, final, append) ->
    g = _.clone(geometry)
    xm = @plot_view.frame.get('x_mappers')['default']
    ym = @plot_view.frame.get('y_mappers')['default']
    if g.type == 'point'
      g.x = xm.map_from_target(g.vx)
      g.y = ym.map_from_target(g.vy)
    else if g.type == 'rect'
      g.x0 = xm.map_from_target(g.vx0)
      g.y0 = ym.map_from_target(g.vy0)
      g.x1 = xm.map_from_target(g.vx1)
      g.y1 = ym.map_from_target(g.vy1)
    else if g.type == 'poly'
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
        geoms = tool_events.get('geometries')
        geoms.push(g)
      else
        geoms = [g]

      tool_events.set("geometries", geoms)
    return null

class SelectTool extends GestureTool.Model

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
        renderers = @get('renderers')
        names = @get('names')

        if renderers.length == 0
          all_renderers = @get('plot').get('renderers')
          renderers = (r for r in all_renderers when r instanceof GlyphRenderer.Model)

        if names.length > 0
          renderers = (r for r in renderers when names.indexOf(r.get('name')) >= 0)

        return renderers
      , true)
    @add_dependencies('computed_renderers', this, ['renderers', 'names', 'plot'])
    @add_dependencies('computed_renderers', @get('plot'), ['renderers'])

    return null

module.exports =
  Model: SelectTool
  View: SelectToolView
