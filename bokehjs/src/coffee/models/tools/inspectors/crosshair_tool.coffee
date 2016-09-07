_ = require "underscore"

InspectTool = require "./inspect_tool"
Span = require "../../annotations/span"
p = require "../../../core/properties"

class CrosshairToolView extends InspectTool.View

  _move: (e) ->
    if not @model.get('active')
      return
    frame = @plot_model.get('frame')
    canvas = @plot_model.get('canvas')
    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    for dim in @model.get('dimensions')
      span = @model.get('spans')[dim]
      if not frame.contains(vx, vy)
        span.unset('computed_location')
      else
        if dim == "width"
          span.set('computed_location', vy)
        else
          span.set('computed_location', vx)

  _move_exit: (e)->
    for dim in @model.get('dimensions')
      span = @model.get('spans')[dim]
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
        render_mode: @get("render_mode")
        location_units: @get("location_units")
        line_color: @get("line_color")
        line_width: @get('line_width')
        line_alpha: @get('line_alpha')
      }),
      height: new Span.Model({
        for_hover: true
        dimension: "height"
        render_mode: @get("render_mode")
        location_units: @get("location_units")
        line_color: @get("line_color")
        line_width: @get('line_width')
        line_alpha: @get('line_alpha')
      })
    }

module.exports =
  Model: CrosshairTool
  View: CrosshairToolView
