_ = require "underscore"

SelectTool = require "./select_tool"
BoxAnnotation = require "../../annotations/box_annotation"
p = require "../../../core/properties"

class BoxSelectToolView extends SelectTool.View

  _pan_start: (e) ->
    canvas = @plot_view.canvas
    @_baseboint = [
      canvas.sx_to_vx(e.bokeh.sx)
      canvas.sy_to_vy(e.bokeh.sy)
    ]
    return null

  _pan: (e) ->
    canvas = @plot_view.canvas
    curpoint = [
      canvas.sx_to_vx(e.bokeh.sx)
      canvas.sy_to_vy(e.bokeh.sy)
    ]
    frame = @plot_model.get('frame')
    dims = @mget('dimensions')

    [vxlim, vylim] = @model._get_dim_limits(@_baseboint, curpoint, frame, dims)
    @mget('overlay').update({left: vxlim[0], right: vxlim[1], top: vylim[1], bottom: vylim[0]})

    if @mget('select_every_mousemove')
      append = e.srcEvent.shiftKey ? false
      @_select(vxlim, vylim, false, append)

    return null

  _pan_end: (e) ->
    canvas = @plot_view.canvas
    curpoint = [
      canvas.sx_to_vx(e.bokeh.sx)
      canvas.sy_to_vy(e.bokeh.sy)
    ]
    frame = @plot_model.get('frame')
    dims = @mget('dimensions')

    [vxlim, vylim] = @model._get_dim_limits(@_baseboint, curpoint, frame, dims)
    append = e.srcEvent.shiftKey ? false
    @_select(vxlim, vylim, true, append)

    @mget('overlay').update({left: null, right: null, top: null, bottom: null})

    @_baseboint = null

    @plot_view.push_state('box_select', {selection: @plot_view.get_selection()})

    return null

  _select: ([vx0, vx1], [vy0, vy1], final, append=false) ->
    geometry = {
      type: 'rect'
      vx0: vx0
      vx1: vx1
      vy0: vy0
      vy1: vy1
    }

    for r in @mget('computed_renderers')
      ds = r.get('data_source')
      sm = ds.get('selection_manager')
      sm.select(@, @plot_view.renderers[r.id], geometry, final, append)

    if @mget('callback')?
      @_emit_callback(geometry)

    @_save_geometry(geometry, final, append)

    return null

  _emit_callback: (geometry) ->
    r = @mget('computed_renderers')[0]
    canvas = @plot_model.get('canvas')
    frame = @plot_model.get('frame')

    geometry['sx0'] = canvas.vx_to_sx(geometry.vx0)
    geometry['sx1'] = canvas.vx_to_sx(geometry.vx1)
    geometry['sy0'] = canvas.vy_to_sy(geometry.vy0)
    geometry['sy1'] = canvas.vy_to_sy(geometry.vy1)

    xmapper = frame.get('x_mappers')[r.get('x_range_name')]
    ymapper = frame.get('y_mappers')[r.get('y_range_name')]
    geometry['x0'] = xmapper.map_from_target(geometry.vx0)
    geometry['x1'] = xmapper.map_from_target(geometry.vx1)
    geometry['y0'] = ymapper.map_from_target(geometry.vy0)
    geometry['y1'] = ymapper.map_from_target(geometry.vy1)

    @mget('callback').execute(@model, {geometry: geometry})

    return

DEFAULT_BOX_OVERLAY = () -> new BoxAnnotation.Model({
  level: "overlay"
  render_mode: "css"
  top_units: "screen"
  left_units: "screen"
  bottom_units: "screen"
  right_units: "screen"
  fill_color: "lightgrey"
  fill_alpha: 0.5
  line_color: "black"
  line_alpha: 1.0
  line_width: 2
  line_dash: [4, 4]
})

class BoxSelectTool extends SelectTool.Model
  default_view: BoxSelectToolView
  type: "BoxSelectTool"
  tool_name: "Box Select"
  icon: "bk-tool-icon-box-select"
  event_type: "pan"
  default_order: 30

  @define {
      dimensions:             [ p.Array,    ["width", "height"] ]
      select_every_mousemove: [ p. Bool,    false               ]
      callback:               [ p.Instance                      ]
      overlay:                [ p.Instance, DEFAULT_BOX_OVERLAY ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @override_computed_property('tooltip', () ->
        @_get_dim_tooltip(
          @tool_name,
          @_check_dims(@get('dimensions'), "box select tool")
        )
      , false)
    @add_dependencies('tooltip', this, ['dimensions'])

module.exports =
  Model: BoxSelectTool
  View: BoxSelectToolView
