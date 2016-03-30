_ = require "underscore"

SelectTool = require "./select_tool"
p = require "../../../core/properties"

class TapToolView extends SelectTool.View

  _tap: (e) ->
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    append = e.srcEvent.shiftKey ? false
    @_select(vx, vy, true, append)

  _select: (vx, vy, final, append) ->
    geometry = {
      type: 'point'
      vx: vx
      vy: vy
    }

    callback = @mget("callback")
    @_save_geometry(geometry, final, append)

    cb_data =
      geometries: @plot_model.get('tool_events').get('geometries')

    for r in @mget('renderers')
      ds = r.get('data_source')
      sm = ds.get('selection_manager')
      sm.select(@, @plot_view.renderers[r.id], geometry, final, append)
      if callback? then callback.execute(ds, cb_data)

    @plot_view.push_state('tap', {selection: @plot_view.get_selection()})

    return null

class TapTool extends SelectTool.Model
  default_view: TapToolView
  type: "TapTool"
  tool_name: "Tap"
  icon: "bk-tool-icon-tap-select"
  event_type: "tap"
  default_order: 10

  props: ->
    return _.extend({}, super(), {
      callback: [ p.Instance ]
    })

module.exports =
  Model: TapTool
  View: TapToolView
