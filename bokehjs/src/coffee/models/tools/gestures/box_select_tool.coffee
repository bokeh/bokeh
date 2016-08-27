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

    for r in @model._get_selectable_renderers()
      ds = r.get('data_source')
      sm = ds.get('selection_manager')
      sm.select(@, @plot_view.renderer_views[r.id], geometry, final, append)

    expanded_geom = @_get_expanded_geometry(geometry)

    if @mget('callback')?
      @_emit_callback(expanded_geom)

    if final
      @_save_geometry(expanded_geom, append)

    return null

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
