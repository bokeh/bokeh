_ = require "underscore"

InspectTool = require "./inspect_tool"
Span = require "../../annotations/span"
p = require "../../../core/properties"

class CrosshairToolView extends InspectTool.View

  _move: (e) ->
    if not @model.active
      return
    frame = @plot_model.frame
    canvas = @plot_model.canvas
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    for dim in @model.dimensions
      span = @model.spans[dim]
      if not frame.contains(vx, vy)
        span.unset('computed_location')
      else
        if dim == "width"
          span.computed_location = vy
        else
          span.computed_location = vx

  _move_exit: (e)->
    for dim in @model.dimensions
      span = @model.spans[dim]
      span.unset('computed_location')

class CrosshairTool extends InspectTool.Model
  default_view: CrosshairToolView
  type: "CrosshairTool"
  tool_name: "Crosshair"

  @define {
      dimensions: [ p.Array, ["width", "height"] ]
      line_color: [ p.Color, 'black'             ]
      line_width: [ p.Number, 1                  ]
      line_alpha: [ p.Number, 1.0                ]
    }

  @internal {
    location_units: [ p.SpatialUnits, "screen" ]
    render_mode:    [ p.RenderMode, "css" ]
    spans:          [ p.Any ]
  }

  @getters {
    tooltip: () -> @_get_dim_tooltip("Crosshair", @_check_dims(@dimensions, "crosshair tool"))
    synthetic_renderers: () -> _.values(@spans)
  }

  initialize: (attrs, options) ->
    super(attrs, options)

    @spans = {
      width: new Span.Model({
        for_hover: true
        dimension: "width",
        render_mode: @render_mode
        location_units: @location_units
        line_color: @line_color
        line_width: @line_width
        line_alpha: @line_alpha
      }),
      height: new Span.Model({
        for_hover: true
        dimension: "height"
        render_mode: @render_mode
        location_units: @location_units
        line_color: @line_color
        line_width: @line_width
        line_alpha: @line_alpha
      })
    }

module.exports =
  Model: CrosshairTool
  View: CrosshairToolView
