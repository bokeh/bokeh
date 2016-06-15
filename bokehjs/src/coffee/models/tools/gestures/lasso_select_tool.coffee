_ = require "underscore"

SelectTool = require "./select_tool"
PolyAnnotation = require "../../annotations/poly_annotation"
p = require "../../../core/properties"

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

    h_range = @plot_model.get('frame').get('h_range')
    v_range = @plot_model.get('frame').get('v_range')
    if vx > h_range.get('end')
      vx = h_range.get('end')
    if vx < h_range.get('start')
      vx = h_range.get('start')

    if vy > v_range.get('end')
      vy = v_range.get('end')
    if vy < v_range.get('start')
      vy = v_range.get('start')

    @data.vx.push(vx)
    @data.vy.push(vy)

    overlay = @mget('overlay')
    overlay.update({xs: @data.vx, ys: @data.vy})

    if @mget('select_every_mousemove')
      append = e.srcEvent.shiftKey ? false
      @_select(@data.vx, @data.vy, false, append)

  _pan_end: (e) ->
    @_clear_overlay()
    append = e.srcEvent.shiftKey ? false
    @_select(@data.vx, @data.vy, true, append)
    @plot_view.push_state('lasso_select', {selection: @plot_view.get_selection()})

  _clear_overlay: () ->
    @mget('overlay').update({xs:[], ys:[]})

  _select: (vx, vy, final, append) ->
    geometry = {
      type: 'poly'
      vx: vx
      vy: vy
    }

    for r in @mget('computed_renderers')
      ds = r.get('data_source')
      sm = ds.get('selection_manager')
      sm.select(@, @plot_view.renderer_views[r.id], geometry, final, append)

    if @mget('callback')?
      @_emit_callback(geometry)

    @_save_geometry(geometry, final, append)

    return null

  _emit_callback: (geometry) ->
    r = @mget('computed_renderers')[0]
    canvas = @plot_model.get('canvas')
    frame = @plot_model.get('frame')

    geometry['sx'] = canvas.v_vx_to_sx(geometry.vx)
    geometry['sy'] = canvas.v_vy_to_sy(geometry.vy)

    xmapper = frame.get('x_mappers')[r.get('x_range_name')]
    ymapper = frame.get('y_mappers')[r.get('y_range_name')]
    geometry['x'] = xmapper.v_map_from_target(geometry.vx)
    geometry['y'] = ymapper.v_map_from_target(geometry.vy)

    @mget('callback').execute(@model, {geometry: geometry})

    return

DEFAULT_POLY_OVERLAY = () -> new PolyAnnotation.Model({
  level: "overlay"
  xs_units: "screen"
  ys_units: "screen"
  fill_color: "lightgrey"
  fill_alpha: 0.5
  line_color: "black"
  line_alpha: 1.0
  line_width: 2
  line_dash: [4, 4]
})

class LassoSelectTool extends SelectTool.Model
  default_view: LassoSelectToolView
  type: "LassoSelectTool"
  tool_name: "Lasso Select"
  icon: "bk-tool-icon-lasso-select"
  event_type: "pan"
  default_order: 12

  @define {
      select_every_mousemove: [ p.Bool,    true                  ]
      callback:               [ p.Instance                       ]
      overlay:                [ p.Instance, DEFAULT_POLY_OVERLAY ]
    }

module.exports =
  Model: LassoSelectTool
  View: LassoSelectToolView
