_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"

class LabelView extends PlotWidget
  initialize: (options) ->
    super(options)
    @text_props = new properties.Text({obj: @model, prefix: 'label_'})
    @fill_props = new properties.Fill({obj: @model, prefix: 'background_'})
    @line_props = new properties.Line({obj: @model, prefix: 'border_'})
    @angle_props = new properties.Angle({obj: @model, attr: 'angle'})

  render: () ->
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    sx = @canvas.vx_to_sx(@_calc_dim('x', @xmapper))
    sy = @canvas.vy_to_sy(@_calc_dim('y', @ymapper))

    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    @text_props.set_value(ctx)

    width = ctx.measureText(@mget('text')).width
    height = ctx.measureText(@mget('text')).ascent / 1.6

    if ctx.textAlign == 'left'
      x_shift = 0
    if ctx.textAlign == 'center'
      x_shift = -width / 2
    if ctx.textAlign == 'right'
      x_shift = -width

    if ctx.textBaseline == 'top'
      y_shift = 0.2 * height
    if ctx.textBaseline == 'middle'
      y_shift = -height / 2
    if ctx.textBaseline == 'bottom'
      y_shift = -1.2 * height
    if ctx.textBaseline == 'alphabetic'
      y_shift = -3 * height / 4 - 0.2 * height
    if ctx.textBaseline == 'hanging'
      y_shift = -height / 4 + 0.2 * height

    ctx.translate(sx + @mget('x_offset'), sy + @mget('y_offset'))

    ctx.rotate(@angle_props.transform([@angle_props.value()]))

    ctx.beginPath()

    ctx.rect(x_shift, y_shift, width, height)
    @fill_props.set_value(ctx)
    ctx.fill()

    @line_props.set_value(ctx)
    ctx.stroke()

    @text_props.set_value(ctx)
    ctx.fillText(@mget('text'), 0, 0)

    ctx.restore()

  _calc_dim: (dim, mapper) ->
    if @mget(dim+'_units') == 'data'
      vdim = mapper.map_to_target(@mget(dim))
    else
      vdim = @mget(dim)
    return vdim

class Label extends HasParent
  default_view: LabelView
  type: 'Label'

  defaults: ->
    return _.extend {}, super(), {
      x_units: 'data'
      y_units: 'data'
      angle: 0
      angle_units: 'rad'
      x_range_name: "default"
      y_range_name: "default"
      x_offset: 0
      y_offset: 0
    }

  display_defaults: ->
    return _.extend {}, super(), {
      level: 'annotation'
      label_text_font: "Helvetica"
      label_text_font_size: "10pt"
      label_text_font_style: "normal"
      label_text_color: "#444444"
      label_text_alpha: 1.0
      label_text_align: "left"
      label_text_baseline: "middle"
      background_fill_color: '#fff9ba'
      background_fill_alpha: 0.0
      border_line_color: '#cccccc'
      border_line_width: 1
      border_line_alpha: 0.0
      border_line_join: 'miter'
      border_line_cap: 'butt'
      border_line_dash: []
      border_line_dash_offset: 0
    }

module.exports =
  Model: Label
  View: LabelView
