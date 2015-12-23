_ = require "underscore"
Annotation = require "./annotation"
PlotWidget = require "../../common/plot_widget"
properties = require "../../common/properties"

class SpanView extends PlotWidget

  initialize: (options) ->
    super(options)
    @line_props = new properties.Line({obj: @model, prefix: ''})
    @$el.appendTo(@plot_view.$el.find('div.bk-canvas-overlays'))
    @$el.css({position: 'absolute'})
    @$el.hide()

  bind_bokeh_events: () ->
    if @mget('for_hover')
      @listenTo(@model, 'change:computed_location', @_draw_span)
    else
      @listenTo(@model, 'change:location', @_draw_span)

  render: () ->
    @_draw_span()

  _draw_span: () ->
    if @mget('for_hover')
      loc = @mget('computed_location')
    else
      loc = @mget('location')

    if not loc?
      @$el.hide()
      return

    frame = @plot_model.get('frame')
    canvas = @plot_model.get('canvas')
    xmapper = @plot_view.frame.get('x_mappers')[@mget("x_range_name")]
    ymapper = @plot_view.frame.get('y_mappers')[@mget("y_range_name")]

    if @mget('dimension') == 'width'
      stop = canvas.vy_to_sy(@_calc_dim(loc, ymapper))
      sleft = canvas.vx_to_sx(frame.get('left'))
      width = frame.get('width')
      height = @line_props.width.value()
    else
      stop = canvas.vy_to_sy(frame.get('top'))
      sleft = canvas.vx_to_sx(@_calc_dim(loc, xmapper))
      width = @line_props.width.value()
      height = frame.get('height')

    if @mget("render_mode") == "css"
      @$el.css({
        'top': stop,
        'left': sleft,
        'width': "#{width}px",
        'height': "#{height}px"
        'z-index': 1000
        'background-color': @line_props.color.value()
        'opacity': @line_props.alpha.value()
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

class Span extends Annotation.Model
  default_view: SpanView
  type: 'Span'

  nonserializable_attribute_names: () ->
    super().concat(['for_hover', 'computed_location'])

  defaults: ->
    return _.extend {}, super(), {
      for_hover: false
      x_range_name: "default"
      y_range_name: "default"
      render_mode: "canvas"
      location_units: "data"
      level: 'annotation'
    }

  display_defaults: ->
    return _.extend {}, super(), {
      dimension: "width"
      location: null
      line_color: 'black'
      line_width: 1
      line_alpha: 1.0
      line_dash: []
      line_dash_offset: 0
      line_cap: "butt"
      line_join: "miter"
    }

module.exports =
  Model: Span
  View: SpanView
