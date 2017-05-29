# requires jquery ui's slider

import {logger} from "core/logging"
import * as p from "core/properties"
import {empty} from "core/dom"
import {throttle} from "core/util/callback"

import {InputWidget, InputWidgetView} from "./input_widget"

import slidertemplate from "./slidertemplate"


export class RangeSliderView extends InputWidgetView
  template: slidertemplate

  initialize: (options) ->
    super(options)
    @connect(@model.properties.start.change, () -> @_render())
    @connect(@model.properties.end.change, () -> @_render())
    @connect(@model.properties.step.change, () -> @_render())
    @connect(@model.properties.orientation.change, () -> @_render())
    empty(@el)
    html = @template(@model.attributes)
    @el.appendChild(html)
    @callbackWrapper = null
    if @model.callback_policy == 'continuous'
      @callbackWrapper = () ->
        @model.callback?.execute(@model)
    if @model.callback_policy == 'throttle' and @model.callback
      @callbackWrapper = throttle(() ->
        @model.callback?.execute(@model)
      , @model.callback_throttle)
    @_render()

  _render: () ->
    @render()
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
    $(@el.querySelector('.slider')).slider(opts)
    if @model.title?
      @el.querySelector( "##{ @model.id }" ).value = $(@el.querySelector('.slider')).slider('values').join(' - ')
    @el.querySelector('.bk-slider-parent').style.height = "#{@model.height}px"
    return @

  slidestop: (event, ui) =>
    if @model.callback_policy == 'mouseup' or @model.callback_policy == 'throttle'
      @model.callback?.execute(@model)

  slide: (event, ui) =>
    values = ui.values
    values_str = values.join(' - ')
    logger.debug("range-slide value = #{values_str}")
    if @model.title?
      @el.querySelector( "##{ @model.id }" ).value = values_str
    @model.range = values
    if @callbackWrapper then @callbackWrapper()

export class RangeSlider extends InputWidget
  type: "RangeSlider"
  default_view: RangeSliderView

  @define {
      range:             [ p.Any,         [0.1, 0.9]   ]
      start:             [ p.Number,      0            ]
      end:               [ p.Number,      1            ]
      step:              [ p.Number,      0.1          ]
      orientation:       [ p.Orientation, "horizontal" ]
      callback_throttle: [ p.Number,      200          ]
      callback_policy:   [ p.String,      "throttle"   ] # TODO (bev) enum
    }
