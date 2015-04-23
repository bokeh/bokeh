_ = require "underscore"
ContinuumView = require "../common/continuum_view"
HasParent = require "../common/has_parent"
{logger} = require "../common/logging"
slidertemplate = require "./slidertemplate"

class SliderView extends ContinuumView
  tagName: "div"
  template: slidertemplate

  initialize: (options) ->
    super(options)
    @render()

  render: () ->
    @$el.empty()
    html = @template(@model.attributes)
    @$el.html(html)
    max = @mget('end')
    min = @mget('start')
    step = @mget('step') or ((max - min)/50)
    logger.debug("slider render: min, max, step = (#{min}, #{max}, #{step})")
    @$('.slider').slider({
      orientation: @mget('orientation')
      animate: "fast",
      slide: _.throttle(@slide, 200),
      value: @mget('value')
      min: min,
      max: max,
      step: step,
    })
    @$( "##{ @mget('id') }" ).val( @$('.slider').slider('value') )
    return @

  slide: (event, ui) =>
    value = ui.value
    logger.debug("slide value = #{value}")
    @$( "##{ @mget('id') }" ).val( ui.value )
    @mset('value', value)
    @model.save()
    @mget('callback')?.execute(@model)

class Slider extends HasParent
  type: "Slider"
  default_view: SliderView

  defaults: ->
    return _.extend {}, super(), {
      title: ''
      value: 0.5
      start: 0
      end: 1
      step: 0
      orientation: "horizontal"
    }

module.exports =
  Model: Slider
  View: SliderView