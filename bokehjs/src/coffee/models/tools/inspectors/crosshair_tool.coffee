import {InspectTool, InspectToolView} from "./inspect_tool"
import {Span} from "../../annotations/span"
import * as p from "core/properties"
import {values} from "core/util/object"

export class CrosshairToolView extends InspectToolView

  _move: (e) ->
    if not @model.active
      return

    frame = @plot_model.frame
    canvas = @plot_model.canvas

    vx = canvas.sx_to_vx(e.bokeh.sx)
    vy = canvas.sy_to_vy(e.bokeh.sy)
    if not frame.contains(vx, vy)
      vx = vy = null

    @_update_spans(vx, vy)

  _move_exit: (e) ->
    @_update_spans(null, null)

  _update_spans: (x, y) ->
    dims = @model.dimensions
    if dims in ['width',  'both'] then @model.spans.width.computed_location  = y
    if dims in ['height', 'both'] then @model.spans.height.computed_location = x

export class CrosshairTool extends InspectTool
  default_view: CrosshairToolView
  type: "CrosshairTool"
  tool_name: "Crosshair"
  icon: "bk-tool-icon-crosshair"

  @define {
      dimensions: [ p.Dimensions, "both"         ]
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
    tooltip: () -> @_get_dim_tooltip("Crosshair", @dimensions)
    synthetic_renderers: () -> values(@spans)
  }

  initialize: (attrs, options) ->
    super(attrs, options)

    @spans = {
      width: new Span({
        for_hover: true
        dimension: "width",
        render_mode: @render_mode
        location_units: @location_units
        line_color: @line_color
        line_width: @line_width
        line_alpha: @line_alpha
      }),
      height: new Span({
        for_hover: true
        dimension: "height"
        render_mode: @render_mode
        location_units: @location_units
        line_color: @line_color
        line_width: @line_width
        line_alpha: @line_alpha
      })
    }
