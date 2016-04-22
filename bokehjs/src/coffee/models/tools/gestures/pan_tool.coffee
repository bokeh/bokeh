_ = require "underscore"

GestureTool = require "./gesture_tool"
p = require "../../../core/properties"

class PanToolView extends GestureTool.View

  _pan_start: (e) ->
    @last_dx = 0
    @last_dy = 0
    canvas = @plot_view.canvas
    frame = @plot_view.frame
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    if not frame.contains(vx, vy)
      hr = frame.get('h_range')
      vr = frame.get('v_range')
      if vx < hr.get('start') or vx > hr.get('end')
        @v_axis_only = true
      if vy < vr.get('start') or vy > vr.get('end')
        @h_axis_only = true
    @plot_view.interactive_timestamp = Date.now()

  _pan: (e) ->
    # TODO (bev) get minus sign from canvas/frame
    @_update(e.deltaX, -e.deltaY)
    @plot_view.interactive_timestamp = Date.now()

  _pan_end: (e) ->
    @h_axis_only = false
    @v_axis_only = false

    if @pan_info?
      @plot_view.push_state('pan', {range: @pan_info})

  _update: (dx, dy) ->
    frame = @plot_view.frame

    new_dx = dx - @last_dx
    new_dy = dy - @last_dy

    hr = _.clone(frame.get('h_range'))
    sx_low  = hr.get('start') - new_dx
    sx_high = hr.get('end') - new_dx

    vr = _.clone(frame.get('v_range'))
    sy_low  = vr.get('start') - new_dy
    sy_high = vr.get('end') - new_dy

    dims = @mget('dimensions')

    if dims.indexOf('width') > -1 and not @v_axis_only
      sx0 = sx_low
      sx1 = sx_high
      sdx = -new_dx
    else
      sx0 = hr.get('start')
      sx1 = hr.get('end')
      sdx = 0

    if dims.indexOf('height') > -1 and not @h_axis_only
      sy0 = sy_low
      sy1 = sy_high
      sdy = new_dy
    else
      sy0 = vr.get('start')
      sy1 = vr.get('end')
      sdy = 0

    @last_dx = dx
    @last_dy = dy

    xrs = {}
    for name, mapper of frame.get('x_mappers')
      [start, end] = mapper.v_map_from_target([sx0, sx1], true)
      xrs[name] = {start: start, end: end}

    yrs = {}
    for name, mapper of frame.get('y_mappers')
      [start, end] = mapper.v_map_from_target([sy0, sy1], true)
      yrs[name] = {start: start, end: end}

    @pan_info = {
      xrs: xrs
      yrs: yrs
      sdx: sdx
      sdy: sdy
    }

    @plot_view.update_range(@pan_info, is_panning=true)
    return null

class PanTool extends GestureTool.Model
  default_view: PanToolView
  type: "PanTool"
  tool_name: "Pan"
  icon: "bk-tool-icon-pan"
  event_type: "pan"
  default_order: 10

  @define {
      dimensions: [ p.Array, ["width", "height"] ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)

    @override_computed_property('tooltip', () ->
        @_get_dim_tooltip(
          "Pan",
          @_check_dims(@get('dimensions'), "pan tool")
        )
      , false)
    @add_dependencies('tooltip', this, ['dimensions'])

module.exports =
  Model: PanTool
  View: PanToolView
