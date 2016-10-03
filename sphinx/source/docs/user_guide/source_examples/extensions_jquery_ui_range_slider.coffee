# These are similar to python imports. BokehJS vendors its own versions
# of Underscore and JQuery. They are available as show here.
_ = require "underscore"
$ = require "jquery"
$2 = require "jquery-ui/slider"
# The "core/properties" module has all the property types
p = require "core/properties"

# We will subclass in JavaScript from the same class that was subclassed
# from in Python
InputWidget = require "models/widgets/input_widget"
slidertemplate = require "models/widgets/slidertemplate"

# This model will actually need to render things, so we must provide
# view. The LayoutDOM model has a view already, so we will start with that
class JQueryRangeSliderView extends InputWidget.View
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
    # Set up parameters
    max = @model.end
    min = @model.start
    disabled = @model.disabled
    values = @model.range or [min, max]
    step = @model.step or ((max - min)/50)
    opts = {
      range: true,
      disabled: disabled
      min: min,
      max: max,
      values: values,
      orientation: @model.orientation,
      animate: "fast",
      step: step ,
      stop: @slidestop,
      slide: @slide
    }
    @$el.find('.slider').slider(opts)
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
    @$( "##{ @model.id }" ).val( ui.values.join(' - ') )
    @model.range = values
    if @callbackWrapper then @callbackWrapper()

class JQueryRangeSlider extends InputWidget.Model

  # If there is an associated view, this is boilerplate.
  default_view: JQueryRangeSliderView

  # The ``type`` class attribute should generally match exactly the name
  # of the corresponding Python class.
  type: "JQueryRangeSlider"

  # The @define block adds corresponding "properties" to the JS model. These
  # should basically line up 1-1 with the Python model class. Most property
  # types have counterparts, e.g. bokeh.core.properties.String will be
  # p.String in the JS implementation. Where the JS type system is not yet
  # as rich, you can use p.Any as a "wildcard" property type.
  @define {
      range:             [ p.Any                       ]
      start:             [ p.Number,      0            ]
      end:               [ p.Number,      1            ]
      step:              [ p.Number,      0.1          ]
      orientation:       [ p.Orientation, "horizontal" ]
      callback_throttle: [ p.Number,      200          ]
      callback_policy:   [ p.String,      "throttle"   ]
  }

# This is boilerplate. Every implementation should export a Model
# and (when applicable) also a View.
module.exports =
  Model: JQueryRangeSlider
  View: JQueryRangeSliderView
