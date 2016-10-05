_ = require "underscore"
$2 = require "jquery-ui/slider"

{logger} = require "../../core/logging"
p = require "../../core/properties"

InputWidget = require "./input_widget"
Widget = require "./widget"

slidertemplate = require "./slidertemplate"


class RangeSliderView extends InputWidget.View
  tagName: "div"
  template: slidertemplate

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'change', @render)
    @$el.empty()
    html = @template(@model.attributes)
    @$el.html(html)
    @callbackWrapper = null
    if @model.callback_policy == 'continuous'
      @callbackWrapper = () ->
        @model.callback?.execute(@model)
    if @model.callback_policy == 'throttle' and @model.callback
      @callbackWrapper = _.throttle(() ->
        @model.callback?.execute(@model)
      , @model.callback_throttle)
    @render()

  render: () ->
    super()
    max = @model.end
    min = @model.start
    step = @model.step or ((max - min)/50)
    logger.debug("range-slider render: min, max, step = (#{min}, #{max}, #{step})")
    opts = {
      range: true,
      orientation: @model.orientation,
      animate: "fast",
      values: @model.range,
      min: min,
      max: max,
      step: step,
      stop: @slidestop,
      slide: @slide
    }
    @$el.find('.slider').slider(opts)
    if @model.title?
      @$( "##{ @model.id }" ).val( @$('.slider').slider('values').join(' - ') )
    @$el.find('.bk-slider-parent').height(@model.height)
    bk_handle = @$el.find('.bk-ui-slider-handle')
    # Map bk handle to ui handle - otherwise slide doesn't work
    if bk_handle.length == 2 
      bk_handle[0].style.left = @$el.find('.ui-slider-handle')[0].style.left
      bk_handle[1].style.left = @$el.find('.ui-slider-handle')[1].style.left
    return @

  slidestop: (event, ui) =>
    if @model.callback_policy == 'mouseup' or @model.callback_policy == 'throttle'
      @model.callback?.execute(@model)

  slide: (event, ui) =>
    values = ui.values
    values_str = values.join(' - ')
    logger.debug("range-slide value = #{values_str}")
    if @model.title?
      @$( "##{ @model.id }" ).val( values_str )
    @model.range = values
    if @callbackWrapper then @callbackWrapper()

class RangeSlider extends InputWidget.Model
  type: "RangeSlider"
  default_view: RangeSliderView

  @define {
      range:             [ p.Any,         {0.1, 0.9}   ]
      start:             [ p.Number,      0            ]
      end:               [ p.Number,      1            ]
      step:              [ p.Number,      0.1          ]
      orientation:       [ p.Orientation, "horizontal" ]
      callback_throttle: [ p.Number,      200          ]
      callback_policy:   [ p.String,      "throttle"   ] # TODO (bev) enum
    }

module.exports =
  Model: RangeSlider
  View: RangeSliderView
