TextAnnotation = require "./text_annotation"
p = require "../../core/properties"

class LabelView extends TextAnnotation.View
  initialize: (options) ->
    super(options)
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    for name, prop of @visuals
      prop.warm_cache(null)

  _get_size: () ->
    ctx = @plot_view.canvas_view.ctx
    @visuals.text.set_value(ctx)

    side = @model.panel.side
    if side == "above" or side == "below"
      height = ctx.measureText(@mget('text')).ascent
      return height
    if side == 'left' or side == 'right'
      width = ctx.measureText(@mget('text')).width
      return width

  render: () ->
    ctx = @plot_view.canvas_view.ctx

    # Here because AngleSpec does units tranform and label doesn't support specs
    switch @mget('angle_units')
      when "rad" then angle = -1 * @mget('angle')
      when "deg" then angle = -1 * @mget('angle') * Math.PI/180.0

    if @mget('x_units') == "data"
      vx = @xmapper.map_to_target(@mget('x'))
    else
      vx = @mget('x')
    sx = @canvas.vx_to_sx(vx)

    if @mget('y_units') == "data"
      vy = @ymapper.map_to_target(@mget('y'))
    else
      vy = @mget('y')
    sy = @canvas.vy_to_sy(vy)

    if @model.panel?
      panel_offset = @_get_panel_offset()
      sx += panel_offset.x
      sy += panel_offset.y

    if @mget('render_mode') == 'canvas'
      @_canvas_text(ctx, @mget('text'), sx + @mget('x_offset'), sy - @mget('y_offset'), angle)
    else
      @_css_text(ctx, @mget('text'), sx + @mget('x_offset'), sy - @mget('y_offset'), angle)

class Label extends TextAnnotation.Model
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

module.exports =
  Model: Label
  View: LabelView
