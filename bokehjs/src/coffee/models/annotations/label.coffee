import {TextAnnotation, TextAnnotationView} from "./text_annotation"
import {hide} from "core/dom"
import * as p from "core/properties"

export class LabelView extends TextAnnotationView
  initialize: (options) ->
    super(options)
    @canvas = @plot_model.canvas
    @visuals.warm_cache(null)

  _get_size: () ->
    ctx = @plot_view.canvas_view.ctx
    @visuals.text.set_value(ctx)

    if @model.panel.is_horizontal
      height = ctx.measureText(@model.text).ascent
      return height
    else
      width = ctx.measureText(@model.text).width
      return width

  render: () ->
    if not @model.visible and @model.render_mode == 'css'
      hide(@el)
    if not @model.visible
      return

    xscale = @plot_view.frame.xscales[@model.x_range_name]
    yscale = @plot_view.frame.yscales[@model.y_range_name]
    ctx = @plot_view.canvas_view.ctx

    # Here because AngleSpec does units tranform and label doesn't support specs
    switch @model.angle_units
      when "rad" then angle = -1 * @model.angle
      when "deg" then angle = -1 * @model.angle * Math.PI/180.0

    panel = @model.panel ? @plot_view.frame

    vx = panel._left.value
    vy = panel._bottom.value

    vx += if @model.x_units == "data" then xscale.compute(@model.x) else @model.x
    vy += if @model.y_units == "data" then yscale.compute(@model.y) else @model.y

    sx = @canvas.vx_to_sx(vx)
    sy = @canvas.vy_to_sy(vy)

    sx += @model.x_offset
    sy -= @model.y_offset

    if @model.render_mode == 'canvas'
      @_canvas_text(ctx, @model.text, sx, sy, angle)
    else
      @_css_text(ctx, @model.text, sx, sy, angle)

export class Label extends TextAnnotation
  default_view: LabelView

  type: 'Label'

  @mixins ['text', 'line:border_', 'fill:background_']

  @define {
      x:            [ p.Number,                      ]
      x_units:      [ p.SpatialUnits, 'data'         ]
      y:            [ p.Number,                      ]
      y_units:      [ p.SpatialUnits, 'data'         ]
      text:         [ p.String,                      ]
      angle:        [ p.Angle,       0               ]
      angle_units:  [ p.AngleUnits,  'rad'           ]
      x_offset:     [ p.Number,      0               ]
      y_offset:     [ p.Number,      0               ]
      x_range_name: [ p.String,      'default'       ]
      y_range_name: [ p.String,      'default'       ]
      render_mode:  [ p.RenderMode,  'canvas'        ]
    }

  @override {
    background_fill_color: null
    border_line_color: null
  }
