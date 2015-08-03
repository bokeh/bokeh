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
    ctx = @plot_view.canvas_view.ctx
    [sleft, sright, stop, sbottom] = @_calc_dims()

    ctx.save()

    ctx.beginPath()
    ctx.rect(sleft, stop, sright-sleft, sbottom-stop)

    @fill_props.set_value(ctx)
    ctx.fill()

    @line_props.set_value(ctx)
    ctx.stroke()

    ctx.restore()

  _calc_dims: () ->
    canvas = @plot_model.get('canvas')
    frame = @plot_model.get('frame')

    sleft = @mget('left') ? frame.get('x_range').get('start')
    sright = @mget('right') ? frame.get('x_range').get('end')
    sbottom = @mget('bottom') ? frame.get('y_range').get('start')
    stop = @mget('top') ? frame.get('y_range').get('end')

    # refactor to pass x/y mapper names
    [[sleft, sright], [stop, sbottom]] = frame.map_to_screen([sleft, sright],
                                                             [stop, sbottom],
                                                             canvas)
    # ugly control logic, may refactor
    if @mget('left_units') == 'screen' and @mget('left')?
      sleft = canvas.vx_to_sx(@mget('left'))
    if @mget('right_units') == 'screen' and @mget('right')?
      sright = canvas.vx_to_sx(@mget('right'))
    if @mget('bottom_units') == 'screen' and @mget('bottom')?
      sbottom = canvas.vy_to_sy(@mget('bottom'))
    if @mget('top_units') == 'screen' and @mget('top')?
      stop = canvas.vy_to_sy(@mget('top'))

    return [sleft, sright, stop, sbottom]

class BoxAnnotation extends HasParent
  default_view: BoxAnnotationView
  type: 'BoxAnnotation'

  display_defaults: ->
    return _.extend {}, super(), {
      level: 'annotation'
      left_units: 'data'
      right_units: 'data'
      top_units: 'data'
      bottom_units: 'data'
      fill_color: '#fff9ba'
      fill_alpha: 1.0
      line_color: '#cccccc'
      line_width: 1
      line_alpha: 1.0
      line_join: 'miter'
      line_cap: 'butt'
      line_dash: []
      line_dash_offset: 0
    }

module.exports =
  Model: BoxAnnotation
  View: BoxAnnotationView
