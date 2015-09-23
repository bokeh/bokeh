_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"

class LabelView extends PlotWidget
  initialize: (options) ->
    super(options)
    @text_props = new properties.Text({obj: @model, prefix: 'label_'})

  render: () ->
    debugger;
    @frame = @plot_model.get('frame')
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    sx = @canvas.vx_to_sx(@_calc_dim('x', @xmapper))
    sy = @canvas.vy_to_sy(@_calc_dim('y', @ymapper))

    ctx = @plot_view.canvas_view.ctx
    ctx.save()
    # @angle_props.set_value(ctx)
    # ctx.rotate(@mget('angle'))
    @text_props.set_value(ctx)
    ctx.translate(@mget('x_offset'), @mget('y_offset'))
    ctx.fillText(@mget('text'), sx, sy)
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
      level: 'overlay'
      label_text_font: "helvetica"
      label_text_font_size: "10pt"
      label_text_font_style: "normal"
      label_text_color: "#444444"
      label_text_alpha: 1.0
      label_text_align: "left"
      label_text_baseline: "middle"
    }

module.exports =
  Model: Label
  View: LabelView
