_ = require "underscore"
PolySelection = require "../../renderer/overlay/poly_selection"
SelectTool = require "./select_tool"

class LassoSelectToolView extends SelectTool.View

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'change:active', @_active_change)
    @data = null

  _active_change: () ->
    if not @mget('active')
      @_clear_overlay()

  _keyup: (e) ->
    if e.keyCode == 13
      @_clear_overlay()

  _pan_start: (e) ->
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)

    @data = {vx: [vx], vy: [vy]}
    return null

  _pan: (e) ->
    canvas = @plot_view.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)

    @data.vx.push(vx)
    @data.vy.push(vy)

    overlay = @mget('overlay')
    new_data = {}
    new_data.vx = _.clone(@data.vx)
    new_data.vy = _.clone(@data.vy)
    overlay.set('data', new_data)

    if @mget('select_every_mousemove')
      append = e.srcEvent.shiftKey ? false
      @_select(@data.vx, @data.vy, false, append)

  _pan_end: (e) ->
    @_clear_overlay()
    append = e.srcEvent.shiftKey ? false
    @_select(@data.vx, @data.vy, true, append)
    @plot_view.push_state('lasso_select', {selection: @plot_view.get_selection()})

  _clear_overlay: () ->
    @mget('overlay').set('data', null)

  _select: (vx, vy, final, append) ->
    geometry = {
      type: 'poly'
      vx: vx
      vy: vy
    }

    for r in @mget('renderers')
      ds = r.get('data_source')
      sm = ds.get('selection_manager')
      sm.select(@, @plot_view.renderers[r.id], geometry, final, append)

    @_save_geometry(geometry, final, append)

    return null

class LassoSelectTool extends SelectTool.Model
  default_view: LassoSelectToolView
  type: "LassoSelectTool"
  tool_name: "Lasso Select"
  icon: "bk-tool-icon-lasso-select"
  event_type: "pan"
  default_order: 12

  initialize: (attrs, options) ->
    super(attrs, options)
    @set('overlay', new PolySelection.Model({line_width: 2}))
    plot_renderers = @get('plot').get('renderers')
    plot_renderers.push(@get('overlay'))
    @get('plot').set('renderers', plot_renderers)

  defaults: () ->
    return _.extend({}, super(), {
      select_every_mousemove: true
    })

module.exports =
  Model: LassoSelectTool
  View: LassoSelectToolView
