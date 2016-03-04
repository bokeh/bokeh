_ = require "underscore"
$2 = require "jquery-ui/slider"

InputWidget = require "./input_widget"
slidertemplate = require "./slidertemplate"
BokehView = require "../../core/bokeh_view"
{logger} = require "../../core/logging"
p = require "../../core/properties"

class SliderView extends BokehView
  tagName: "div"
  template: slidertemplate

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'change', @render)
    @$el.empty()
    html = @template(@model.attributes)
    @$el.html(html)
    @render()

  render: () ->
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
      step: step
    }
    switch @mget('callback_policy')
      when 'continious'
        opts.slide = @slide
      when 'throttle'
        opts.slide = _.throttle(@slide, @mget('callback_throttle'))
      when 'mouseup'
        opts.stop = @slide
      else
        opts.stop = @slide
        logger.debug("slider render: ERROR: do not know how to handle the callback policy")
    @$('.slider').slider(opts)
    @$( "##{ @mget('id') }" ).val( @$('.slider').slider('value') )
    return @

  slide: (event, ui) =>
    value = ui.value
    logger.debug("slide value = #{value}")
    @$( "##{ @mget('id') }" ).val( ui.value )
    @mset('value', value)
    @mget('callback')?.execute(@model)

class Slider extends InputWidget.Model
  type: "Slider"
  default_view: SliderView

  props: ->
    return _.extend {}, super(), {
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
