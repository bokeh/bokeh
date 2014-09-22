define [
  "common/collection"
  "underscore"
  "common/continuum_view"
  "common/has_parent"
  "common/logging"
  "./slidertemplate"
  "jquery_ui/slider"
], (Collection, _, ContinuumView, HasParent, Logging, slidertemplate) ->

  logger = Logging.logger

  class SliderView extends ContinuumView
    tagName : "div"

    template : slidertemplate

    initialize : (options) ->
      super(options)
      @render()

    render : () ->
      @$el.empty()
      html = @template(@model.attributes)
      @$el.html(html)
      max = @mget('end')
      min = @mget('start')
      step = @mget('step') or ((max - min)/50)
      logger.debug("slider render: min, max, step = (#{min}, #{max}, #{step})")
      @$('.slider').slider({
        orientation : @mget('orientation')
        animate : "fast",
        slide : _.throttle(@slide, 200),
        value : @mget('value')
        min : min,
        max : max,
        step : step,
      })
      @$( "##{ @mget('id') }" ).val( @$('.slider').slider('value') );

    slide : (event, ui) =>
      value = ui.value
      logger.debug("slide value = #{value}")
      @$( "##{ @mget('id') }" ).val( ui.value );
      @mset('value', value)
      @model.save()

  class Slider extends HasParent
    type : "Slider"
    default_view : SliderView

    defaults: ->
      return _.extend {}, super(), {
        title: ''
        value: 0.5
        start: 0
        end: 1
        step: 0
        orientation: "horizontal"
      }

  class Sliders extends Collection
    model : Slider

  return {
    Model : Slider
    Collection : new Sliders()
    View : SliderView
  }
