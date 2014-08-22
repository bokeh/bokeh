define [
  "common/has_parent",
  "common/continuum_view",
  "backbone"
  "underscore"
  "./slidertemplate"
  "jquery_ui/slider"
], (HasParent, continuum_view, Backbone, _, slidertemplate) ->
  ContinuumView = continuum_view.View
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
      console.log('sliderval', min, max, step)
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
      console.log('sliding', value)
      @$( "##{ @mget('id') }" ).val( ui.value );
      @mset('value', value)
      @model.save()

  class Slider extends HasParent
    type : "Slider"
    default_view : SliderView
    defaults : () ->
      def =
        title : ''
        value : 0.5
        start : 0
        end : 1
        step : 0
        orientation : "horizontal"
      return def

  class Sliders extends Backbone.Collection
    model : Slider
  sliders = new Sliders()
  return {
    "Model" : Slider
    "Collection" : sliders
    "View" : SliderView
  }
