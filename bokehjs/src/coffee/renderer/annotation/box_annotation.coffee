_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"

class BoxAnnotationView extends PlotWidget
  initialize: (options) ->
    super(options)
    @fill_props = new properties.Fill({obj: @model, prefix: ''})
    @line_props = new properties.Line({obj: @model, prefix: ''})

  render: () ->
    @frame = @plot_model.get('frame')
    @canvas = @plot_model.get('canvas')
    @xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    @ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    sleft = @canvas.vx_to_sx(@_calc_dim('left', @xmapper, @frame.get('h_range').get('start')))
    sright = @canvas.vx_to_sx(@_calc_dim('right', @xmapper, @frame.get('h_range').get('end')))
    sbottom = @canvas.vy_to_sy(@_calc_dim('bottom', @ymapper, @frame.get('v_range').get('start')))
    stop = @canvas.vy_to_sy(@_calc_dim('top', @ymapper, @frame.get('v_range').get('end')))

    ctx = @plot_view.canvas_view.ctx
    ctx.save()

    ctx.beginPath()
    ctx.rect(sleft, stop, sright-sleft, sbottom-stop)

    @fill_props.set_value(ctx)
    ctx.fill()

    @line_props.set_value(ctx)
    ctx.stroke()

    ctx.restore()

  _calc_dim: (dim, mapper, frame_extrema) ->
    if @mget(dim)?
      if @mget(dim+'_units') == 'data'
        vdim = mapper.map_to_target(@mget(dim))
      else
        vdim = @mget(dim)
    else
      vdim = frame_extrema
    return vdim

class BoxAnnotation extends HasParent
  default_view: BoxAnnotationView
  type: 'BoxAnnotation'

  defaults: ->
    return _.extend {}, super(), {
      x_range_name: "default"
      y_range_name: "default"
    }

  display_defaults: ->
    return _.extend {}, super(), {
      level: 'annotation'
      left_units: 'data'
      right_units: 'data'
      top_units: 'data'
      bottom_units: 'data'
      fill_color: '#fff9ba'
      fill_alpha: 0.4
      line_color: '#cccccc'
      line_width: 1
      line_alpha: 0.3
      line_join: 'miter'
      line_cap: 'butt'
      line_dash: []
      line_dash_offset: 0
    }

module.exports =
  Model: BoxAnnotation
  View: BoxAnnotationView
