_ = require "underscore"
HasParent = require "../../common/has_parent"
PlotWidget = require "../../common/plot_widget"
{logger} = require "../../common/logging"

class SpanView extends PlotWidget

  initialize: (options) ->
    super(options)
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

    if @mget('dimension') == 'width'
      top = canvas.vy_to_sy(@mget('location'))
      left = canvas.vx_to_sx(frame.get('left'))
      width = "#{frame.get('width')}px"
      height = "1px"
    else
      top = canvas.vy_to_sy(frame.get('top'))
      left = canvas.vx_to_sx(@mget('location'))
      width = "1px"
      height = "#{frame.get('height')}px"

    @$el.css({
      'top': top,
      'left': left,
      'width': width,
      'height': height
      'z-index': 1000
      'background-color': @mget('color')
      })
    @$el.show()

class Span extends HasParent
  default_view: SpanView
  type: 'Span'

  defaults: ->
    return _.extend {}, super(), {
      level: "overlay"
      dimension: "width"
      units: "screen"
      color: "black"
    }

module.exports =
  Model: Span
  View: SpanView
