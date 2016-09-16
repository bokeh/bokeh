_ = require "underscore"

SelectTool = require "models/tools/gestures/select_tool"
BoxAnnotation = require "models/annotations/box_annotation"
ColorBar = require "models/annotations/color_bar"
LinearColorMapper = require "models/mappers/linear_color_mapper"
p = require "core/properties"

class ColorBarToolView extends SelectTool.View

  initialize: (options) ->
    super(options)
    @_initial_mapper_low = @model.color_bar.color_mapper.low
    @_initial_mapper_high = @model.color_bar.color_mapper.high
    @listenTo(@model, 'change:active', () ->
      @_toggle_active()
      @plot_view.request_render()
    )

  _toggle_active: () ->
    @model.color_bar.visible = @model.active
    @model.overlay.update({left: null, right: null, top: null, bottom: null})

    # if we want to undo the mapper changes when tool is deactivated:
    # if not @model.active
    #   @model.color_bar.color_mapper.low = @_initial_mapper_low
    #   @model.color_bar.color_mapper.high = @_initial_mapper_high

  _get_image_dims: () ->
    color_bar_view = @plot_view.renderer_views[1039]

    panel_offset = color_bar_view._get_panel_offset() #need to flip y value
    frame_offset = color_bar_view._get_frame_offset()
    image_offset = color_bar_view._get_image_offset()

    x_offset = (panel_offset.x + frame_offset.x + image_offset.x)
    y_offset = -(panel_offset.y + frame_offset.y + image_offset.y)

    image_dims = @model.color_bar._computed_image_dimensions() #height and width attrs

    dims = {
      x0: x_offset
      x1: x_offset + image_dims.width
      y0: y_offset - image_dims.height
      y1: y_offset
    }

    return dims

  _validate_point: (e) ->
    dims = @_get_image_dims()

    if dims.x0 <= e.bokeh.sx <= dims.x1
      x_hit = true
    else
      x_hit = false

    if dims.y0 <= e.bokeh.sy <= dims.y1
      y_hit = true
    else
      y_hit = false

    return x_hit and y_hit

  _pan_start: (e) ->
    did_hit = @_validate_point(e)

    if did_hit
      dims = @_get_image_dims()
      @_basepoint = [
        @plot_view.canvas.sx_to_vx(dims.x0)
        @plot_view.canvas.sy_to_vy(e.bokeh.sy)
      ]
    else
      @_basepoint = null

    return null

  _pan: (e) ->
    if _.isNull(@_basepoint)
      return null

    did_hit = @_validate_point(e)

    if not did_hit
      return

    dims = @_get_image_dims()

    @_curpoint = [
      @plot_view.canvas.sx_to_vx(dims.x1)
      @plot_view.canvas.sy_to_vy(e.bokeh.sy)
    ]

    @model.overlay.update({
      left: @_basepoint[0]
      right: @_curpoint[0]
      top: @_basepoint[1]
      bottom: @_curpoint[1]
    })

    return null

  _pan_end: (e) ->
    if _.isNull(@_basepoint)
      return null

    did_hit = @_validate_point(e)

    dims = @_get_image_dims()

    @_curpoint = [
      @plot_view.canvas.sx_to_vx(dims.x1)
      @plot_view.canvas.sy_to_vy(e.bokeh.sy)
    ]

    if not did_hit
      @model.overlay.update({left: null, right: null, top: null, bottom: null})
      return null

    image_dims = @model.color_bar._computed_image_dimensions()
    mapper = @model.color_bar._tick_coordinate_mapper(image_dims.height)

    offset_dims = @_get_image_dims()
    start = mapper.map_from_target(@_curpoint[1] - offset_dims.y0)
    end = mapper.map_from_target(@_basepoint[1] - offset_dims.y0)

    @model.color_bar.color_mapper.low = start
    @model.color_bar.color_mapper.high = end

    @plot_view.request_render()

    @model.overlay.update({left: null, right: null, top: null, bottom: null})

    @_basepoint = null

    return null

DEFAULT_COLOR_BAR = () -> new ColorBar.Model({
  location: [0, 0]
  color_mapper: new LinearColorMapper.Model({palette:'Spectral9', low:0, high:10})
})

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

class ColorBarTool extends SelectTool.Model
  default_view: ColorBarToolView
  type: "ColorBarTool"
  tool_name: "Color Bar Tool"
  icon: "bk-tool-icon-box-select"
  event_type: "pan"
  default_order: 30

  @define {
      color_bar:                [ p.Instance, DEFAULT_COLOR_BAR   ]
      overlay:                  [ p.Instance, DEFAULT_BOX_OVERLAY ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @plot.add_layout(@color_bar, 'right')

module.exports =
  Model: ColorBarTool
  View: ColorBarToolView
