import {throttle} from "core/util/callback"

# The "core/properties" module has all the property types
import * as p from "core/properties"

# HTML construction and manipulation functions
import {empty, label, input, div} from "core/dom"

# We will subclass in JavaScript from the same class that was subclassed
# from in Python
import {InputWidget, InputWidgetView} from "models/widgets/input_widget"

# This model will actually need to render things, so we must provide
# view. The LayoutDOM model has a view already, so we will start with that
export class IonRangeSliderView extends InputWidgetView
  _createElement: () ->
    el = super()
    @$el = $(el)
    return el

  template: () ->
    if @model.title?
      if @model.title.length != 0
        title = label({for: @model.id}, " #{@model.title}: ")
      value = input({type: "text", id: @model.id, readonly: true})

    return (
      div({class: "bk-slider-parent"},
        title,
        value,
        div({class: "bk-slider-horizontal"},
          input({type: "text", class: "slider", id: @model.id})
        )
      )
    )

  initialize: (options) ->
    super(options)
    @connect(@model.change, @render)
    empty(@el)
    @el.appendChild(@template())
    @callbackWrapper = null
    if @model.callback_policy == 'continuous'
      @callbackWrapper = () ->
        @model.callback?.execute(@model)
    if @model.callback_policy == 'throttle' and @model.callback
      @callbackWrapper = throttle(() ->
        @model.callback?.execute(@model)
      , @model.callback_throttle)
    @render()

  render: () ->
    # Backbone Views create <div> elements by default, accessible as @$el.
    # Many Bokeh views ignore this default <div>, and instead do things
    # like draw to the HTML canvas. In this case though, we change the
    # contents of the <div>, based on the current slider value.
    super()
    # Set up parameters
    max = @model.end
    min = @model.start
    grid = @model.grid
    disable = @model.disabled
    range = @model.range or [max, min]
    [from, to] = range
    step = @model.step or ((max - min)/50)
    opts = {
      type: "double",
      grid: grid,
      min: min,
      max: max,
      from: from,
      to: to,
      step: step,
      disable: disable,
      onChange: (data) => @slide(data),
      onFinish: (data) => @slidestop(data),
    }

    input = @$el.find('.slider')[0]
    slider = jQuery(input).ionRangeSlider(opts)
    range = [from, to]
    @$el.find( "##{ @model.id }" ).val( range.join(' - '))
    @$el.find('.bk-slider-parent').height(@model.height)
    return @


  slidestop: (data) ->
    if @model.callback_policy == 'mouseup' or @model.callback_policy == 'throttle'
      @model.callback?.execute(@model)

  slide: (data) ->
    range = [data.from, data.to]
    value = range.join(' - ')
    @$el.find( "##{ @model.id }" ).val( value )
    @model.range = range
    if @callbackWrapper then @callbackWrapper()

export class IonRangeSlider extends InputWidget

  # If there is an associated view, this is boilerplate.
  default_view: IonRangeSliderView

  # The ``type`` class attribute should generally match exactly the name
  # of the corresponding Python class.
  type: "IonRangeSlider"

  # The @define block adds corresponding "properties" to the JS model. These
  # should basically line up 1-1 with the Python model class. Most property
  # types have counterparts, e.g. bokeh.core.properties.String will be
  # p.String in the JS implementation. Where the JS type system is not yet
  # as rich, you can use p.Any as a "wildcard" property type.
  @define {
      range:             [ p.Any,                      ]
      start:             [ p.Number,      0            ]
      end:               [ p.Number,      1            ]
      step:              [ p.Number,      0.1          ]
      grid:              [ p.Bool,        true         ]
      callback_throttle: [ p.Number,      200          ]
      callback_policy:   [ p.String,      "throttle"   ]
  }
