_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"

class TextAnnotationView extends PlotWidget
  initialize: (options) ->
    super(options)
    @text_props = new properties.Text({obj: @model, prefix: ''})
    @angle_props = new properties.Angle({obj: @model, prefix: ''})

  render: () ->
    @frame = @plot_model.get('frame')
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    sx = @canvas.vx_to_sx(@_calc_dim('x', @xmapper))
    sy = @canvas.vy_to_sy(@_calc_dim('y', @ymapper))

    ctx = @plot_view.canvas_view.ctx
    ctx.save()
    @angle_props.set_value(ctx)
    ctx.rotate(@mget('angle'))
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

class TextAnnotation extends HasParent
  default_view: TextAnnotationView
  type: 'TextAnnotation'

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
      # label_standoff: 15
      text_font: "helvetica"
      text_font_size: "10pt"
      text_font_style: "normal"
      text_color: "#444444"
      text_alpha: 1.0
      text_align: "left"
      text_baseline: "middle"
    }

module.exports =
  Model: TextAnnotation
  View: TextAnnotationView
