_ = require "underscore"

GestureTool = require "./gesture_tool"
BoxAnnotation = require "../../annotations/box_annotation"
p = require "../../../core/properties"

class BoxZoomToolView extends GestureTool.View

  _match_aspect: (basepoint, curpoint, frame) ->

    # aspect ratio of plot frame
    hend = frame.get('h_range').get('end')
    hstart = frame.get('h_range').get('start')
    vend = frame.get('v_range').get('end')
    vstart = frame.get('v_range').get('start')
    w = hend - hstart
    h = vend - vstart
    a = w/h

    # current aspect of cursor-defined box
    vw = Math.abs(basepoint[0]-curpoint[0])
    vh = Math.abs(basepoint[1]-curpoint[1])
    if vh == 0
      va = 0
    else
      va = vw/vh

    if va >= a
      [xmod, ymod] = [1, va/a]
    else
      [xmod, ymod] = [a/va, 1]

    # OK the code blocks below merit some explanation. They do:
    #
    # compute left/right, pin to frame if necessary
    # compute top/bottom (based on new left/right), pin to frame if necessary
    # recompute left/right (based on top/bottom), in case top/bottom were pinned

    # basepoint[0] is left
    if ( basepoint[0] <= curpoint[0] )
      left = basepoint[0]
      right = basepoint[0] + vw * xmod
      if right > hend
        right = hend
    # basepoint[0] is right
    else
      right = basepoint[0]
      left = basepoint[0] - vw * xmod
      if left < hstart
        left = hstart

    vw = Math.abs(right - left)

    # basepoint[1] is bottom
    if ( basepoint[1] <= curpoint[1] )
      bottom = basepoint[1]
      top = basepoint[1] + vw/a
      if top > vend
        top = vend

    # basepoint[1] is top
    else
      top = basepoint[1]
      bottom = basepoint[1] - vw/a
      if bottom < vstart
        bottom = vstart

    vh = Math.abs(top - bottom)

    # basepoint[0] is left
    if ( basepoint[0] <= curpoint[0] )
      right = basepoint[0] + a*vh

    # basepoint[0] is right
    else
      left = basepoint[0] - a*vh

    return [[left, right], [bottom, top]]

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

    if @mget('match_aspect') and dims.length == 2
      [vx, vy] = @_match_aspect(@_baseboint, curpoint, frame)
    else
      [vx, vy] = @model._get_dim_limits(@_baseboint, curpoint, frame, dims)

    @mget('overlay').update({left: vx[0], right: vx[1], top: vy[1], bottom: vy[0]})

    return null

  _pan_end: (e) ->
    canvas = @plot_view.canvas
    curpoint = [
      canvas.sx_to_vx(e.bokeh.sx)
      canvas.sy_to_vy(e.bokeh.sy)
    ]
    frame = @plot_model.get('frame')
    dims = @mget('dimensions')

    if @mget('match_aspect') and dims.length == 2
      [vx, vy] = @_match_aspect(@_baseboint, curpoint, frame)
    else
      [vx, vy] = @model._get_dim_limits(@_baseboint, curpoint, frame, dims)

    @_update(vx, vy)

    @mget('overlay').update({left: null, right: null, top: null, bottom: null})
    @_baseboint = null
    return null

  _update: (vx, vy) ->
    # If the viewing window is too small, no-op: it is likely that the user did
    # not intend to make this box zoom and instead was trying to cancel out of the
    # zoom, a la matplotlib's ToolZoom. Like matplotlib, set the threshold at 5 pixels.
    if Math.abs(vx[1] - vx[0]) <= 5 or Math.abs(vy[1] - vy[0]) <= 5
      return

    xrs = {}
    for name, mapper of @plot_view.frame.get('x_mappers')
      [start, end] = mapper.v_map_from_target(vx, true)
      xrs[name] = {start: start, end: end}

    yrs = {}
    for name, mapper of @plot_view.frame.get('y_mappers')
      [start, end] = mapper.v_map_from_target(vy, true)
      yrs[name] = {start: start, end: end}

    zoom_info = {
      xrs: xrs
      yrs: yrs
    }

    @plot_view.push_state('box_zoom', {range: zoom_info})
    @plot_view.update_range(zoom_info)

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

class BoxZoomTool extends GestureTool.Model
  default_view: BoxZoomToolView
  type: "BoxZoomTool"
  tool_name: "Box Zoom"
  icon: "bk-tool-icon-box-zoom"
  event_type: "pan"
  default_order: 20

  initialize: (attrs, options) ->
    super(attrs, options)
    @override_computed_property('tooltip', () ->
        @_get_dim_tooltip(
          @tool_name,
          @_check_dims(@get('dimensions'), "box zoom tool")
        )
      , false)
    @add_dependencies('tooltip', this, ['dimensions'])

  @define {
      dimensions:   [ p.Array,    ["width", "height"] ]
      overlay:      [ p.Instance, DEFAULT_BOX_OVERLAY ]
      match_aspect: [ p.Bool,     false               ]
    }

module.exports =
  Model: BoxZoomTool
  View: BoxZoomToolView
