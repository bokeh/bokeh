_ = require "underscore"
{logger} = require "../../common/logging"
GestureTool = require "./gesture_tool"

class SelectToolView extends GestureTool.View

  _keyup: (e) ->
    if e.keyCode == 27
      for r in @mget('renderers')
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
      tool_events = @plot_model.get('tool_events')
      if append
        geoms = tool_events.get('geometries')
        geoms.push(g)
      else
        geoms = [g]

      tool_events.set("geometries", geoms)
      tool_events.save()
    return null

class SelectTool extends GestureTool.Model

  initialize: (attrs, options) ->
    super(attrs, options)

    names = @get('names')
    renderers = @get('renderers')

    if renderers.length == 0
      all_renderers = @get('plot').get('renderers')
      renderers = (r for r in all_renderers when r.type == "GlyphRenderer")

    if names.length > 0
      renderers = (r for r in renderers when names.indexOf(r.get('name')) >= 0)

    @set('renderers', renderers)
    logger.debug("setting #{renderers.length} renderers for #{@type} #{@id}")
    for r in renderers
      logger.debug(" - #{r.type} #{r.id}")
    return null

  defaults: () ->
    return _.extend({}, super(), {
      renderers: []
      names: []
      multi_select_modifier: "shift"
    })

module.exports =
  Model: SelectTool
  View: SelectToolView