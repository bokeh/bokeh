_ = require "underscore"
$2 = require "jquery-ui/slider"

{logger} = require "../../core/logging"
p = require "../../core/properties"

InputWidget = require "./input_widget"
Widget = require "./widget"

slidertemplate = require "./slidertemplate"


class SliderView extends InputWidget.View
  tagName: "div"
  template: slidertemplate

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'change', @render)
    @$el.empty()
    html = @template(@model.attributes)
    @$el.html(html)
    @callbackWrapper = null
    if @mget('callback_policy') == 'continuous'
      @callbackWrapper = () ->
        @mget('callback')?.execute(@model)
    if @mget('callback_policy') == 'throttle' and @mget('callback')
      @callbackWrapper = _.throttle(() ->
        @mget('callback')?.execute(@model)
      , @mget('callback_throttle'))
    @render()

  render: () ->
    super()
    max = @mget('end')
    min = @mget('start')
    step = @mget('step') or ((max - min)/50)
    logger.debug("slider render: min, max, step = (#{min}, #{max}, #{step})")
    opts = {
      orientation: @mget('orientation'),
      animate: "fast",
      value: @mget('value'),
      min: min,
      max: max,
      step: step,
      stop: @slidestop,
      slide: @slide
    }
    @$el.find('.slider').slider(opts)
    @$( "##{ @mget('id') }" ).val( @$('.slider').slider('value') )
    @$el.find('.bk-slider-parent').height(@mget('height'))
    return @

  slidestop: (event, ui) =>
    if @mget('callback_policy') == 'mouseup' or @mget('callback_policy') == 'throttle'
      @mget('callback')?.execute(@model)

  slide: (event, ui) =>
    value = ui.value
    logger.debug("slide value = #{value}")
    @$( "##{ @mget('id') }" ).val( ui.value )
    @mset('value', value)
    if @callbackWrapper then @callbackWrapper()

class Slider extends InputWidget.Model
  type: "Slider"
  default_view: SliderView

  @define {
      value:             [ p.Number,      0.5          ]
      start:             [ p.Number,      0            ]
      end:               [ p.Number,      1            ]
      step:              [ p.Number,      0.1          ]
      orientation:       [ p.Orientation, "horizontal" ]
      callback_throttle: [ p.Number,      200          ]
      callback_policy:   [ p.String,      "throttle"   ] # TODO (bev) enum
    }

module.exports =
  Model: Slider
  View: SliderView
