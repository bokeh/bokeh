_ = require "underscore"
BoxSelection = require "../../renderer/overlay/box_selection"
GestureTool = require "./gesture_tool"

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
    @mget('overlay').set('data', {vxlim: vxlim, vylim: vylim})

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

    @mget('overlay').set('data', {})
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

    @set('overlay', new BoxSelection.Model)
    plot_renderers = @get('plot').get('renderers')
    plot_renderers.push(@get('overlay'))
    @get('plot').set('renderers', plot_renderers)

  defaults: () ->
    return _.extend({}, super(), {
      dimensions: ["width", "height"]
    })

module.exports =
  Model: BoxZoomTool
  View: BoxZoomToolView
