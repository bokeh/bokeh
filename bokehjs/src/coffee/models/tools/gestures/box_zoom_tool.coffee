_ = require "underscore"

GestureTool = require "./gesture_tool"
BoxAnnotation = require "../../annotations/box_annotation"
p = require "../../../core/properties"

class BoxZoomToolView extends GestureTool.View

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
    @_update(vxlim, vylim)

    @mget('overlay').update({left: null, right: null, top: null, bottom: null})
    @_baseboint = null
    return null

  _update: (vxlim, vylim) ->
    # If the viewing window is too small, no-op: it is likely that the user did
    # not intend to make this box zoom and instead was trying to cancel out of the
    # zoom, a la matplotlib's ToolZoom. Like matplotlib, set the threshold at 5 pixels.
    if Math.abs(vxlim[1] - vxlim[0]) <= 5 or Math.abs(vylim[1] - vylim[0]) <= 5
      return

    xrs = {}
    for name, mapper of @plot_view.frame.get('x_mappers')
      [start, end] = mapper.v_map_from_target(vxlim, true)
      xrs[name] = {start: start, end: end}

    yrs = {}
    for name, mapper of @plot_view.frame.get('y_mappers')
      [start, end] = mapper.v_map_from_target(vylim, true)
      yrs[name] = {start: start, end: end}

    zoom_info = {
      xrs: xrs
      yrs: yrs
    }

    @plot_view.push_state('box_zoom', {range: zoom_info})
    @plot_view.update_range(zoom_info)

DEFAULT_BOX_OVERLAY = new BoxAnnotation.Model({
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
  silent_update: true
})

class BoxZoomTool extends GestureTool.Model
  default_view: BoxZoomToolView
  type: "BoxZoomTool"
  tool_name: "Box Zoom"
  icon: "bk-tool-icon-box-zoom"
  event_type: "pan"
  default_order: 20

  initialize: (attrs, options) ->
    super(attrs, options)
    @register_property('tooltip', () ->
        @_get_dim_tooltip(
          @get("tool_name"),
          @_check_dims(@get('dimensions'), "box zoom tool")
        )
      , false)
    @add_dependencies('tooltip', this, ['dimensions'])

  props: () ->
    return _.extend({}, super(), {
      dimensions: [ p.Array,    ["width", "height"] ]
      overlay:    [ p.Instance, DEFAULT_BOX_OVERLAY ]
    })

module.exports =
  Model: BoxZoomTool
  View: BoxZoomToolView
