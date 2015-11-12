_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
{logger} = require "../../common/logging"
properties = require "../../common/properties"

class SpanView extends PlotWidget

  initialize: (options) ->
    super(options)
    @line_props = new properties.Line({obj: @model, prefix: ''})
    @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))
    @$el.css({position: 'absolute'})
    @$el.hide()

  bind_bokeh_events: () ->
    @listenTo(@model, 'change:location', @_draw_span)

  render: () ->
    @_draw_span()

  _draw_span: () ->
    if not @mget('location')?
      @$el.hide()
      return

    frame = @plot_model.get('frame')
    canvas = @plot_model.get('canvas')
    xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    if @mget('dimension') == 'width'
      stop = canvas.vy_to_sy(@_calc_dim(@mget('location'), ymapper))
      sleft = canvas.vx_to_sx(frame.get('left'))
      width = frame.get('width')
      height = @mget('line_width')
    else
      stop = canvas.vy_to_sy(frame.get('top'))
      sleft = canvas.vx_to_sx(@_calc_dim(@mget('location'), xmapper))
      width = @mget('line_width')
      height = frame.get('height')

    if @mget("render_mode") == "css"
      @$el.css({
        'top': stop,
        'left': sleft,
        'width': "#{width}px",
        'height': "#{height}px"
        'z-index': 1000
        'background-color': @mget('line_color')
        'opacity': @mget('line_alpha')
        })
      @$el.show()

    else if @mget("render_mode") == "canvas"
      ctx = @plot_view.canvas_view.ctx
      ctx.save()

      ctx.beginPath()
      @line_props.set_value(ctx)
      ctx.moveTo(sleft, stop)
      if @mget('dimension') == "width"
        ctx.lineTo(sleft + width, stop)
      else
        ctx.lineTo(sleft, stop + height)
      ctx.stroke()

      ctx.restore()

  _calc_dim: (location, mapper) ->
      if @mget('location_units') == 'data'
        vdim = mapper.map_to_target(location)
      else
        vdim = location
      return vdim

class Span extends HasParent
  default_view: SpanView
  type: 'Span'

  defaults: ->
    return _.extend {}, super(), {
      x_range_name: "default"
      y_range_name: "default"
      render_mode: "canvas"
      location_units: "data"
    }

  display_defaults: ->
    return _.extend {}, super(), {
      level: 'annotation'
      line_color: 'black'
      line_width: 1
      line_alpha: 1.0
      line_dash: []
      line_dash_offset: 0
    }

module.exports =
  Model: Span
  View: SpanView
