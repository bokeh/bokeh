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
    if @model.get('callback_policy') == 'continuous'
      @callbackWrapper = () ->
        @model.get('callback')?.execute(@model)
    if @model.get('callback_policy') == 'throttle' and @model.get('callback')
      @callbackWrapper = _.throttle(() ->
        @model.get('callback')?.execute(@model)
      , @model.get('callback_throttle'))
    @render()

  render: () ->
    super()
    max = @model.get('end')
    min = @model.get('start')
    step = @model.get('step') or ((max - min)/50)
    logger.debug("slider render: min, max, step = (#{min}, #{max}, #{step})")
    opts = {
      orientation: @model.get('orientation'),
      animate: "fast",
      value: @model.get('value'),
      min: min,
      max: max,
      step: step,
      stop: @slidestop,
      slide: @slide
    }
    @$el.find('.slider').slider(opts)
    @$( "##{ @model.get('id') }" ).val( @$('.slider').slider('value') )
    @$el.find('.bk-slider-parent').height(@model.get('height'))
    return @

  slidestop: (event, ui) =>
    if @model.get('callback_policy') == 'mouseup' or @model.get('callback_policy') == 'throttle'
      @model.get('callback')?.execute(@model)

  slide: (event, ui) =>
    value = ui.value
    logger.debug("slide value = #{value}")
    @$( "##{ @model.get('id') }" ).val( ui.value )
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
