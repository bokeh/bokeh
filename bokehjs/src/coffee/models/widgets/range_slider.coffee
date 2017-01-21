import * as noUiSlider from "nouislider"

import {logger} from "core/logging"
import * as p from "core/properties"
import {empty} from "core/dom"
import {throttle} from "core/util/callback"

import {Widget, WidgetView} from "./widget"

export class RangeSliderView extends WidgetView

  initialize: (options) ->
    super(options)
    @render()

  connect_signals: () ->
    @listenTo(@model.change, () => @render())

  render: () ->
    super()

    if @model.callback?
      callback = () => @model.callback.execute(@model)

      switch @model.callback_policy
        when 'continuous'
          @callback_wrapper = callback
        when 'throttle'
          @callback_wrapper = throttle(callback, @model.callback_throttle)

    if @model.disabled
      @el.setAttribute('disabled', true)
    else
      @el.removeAttribute('disabled')

    if not @el.noUiSlider?
      noUiSlider.create(@el, {
        cssPrefix: 'bk-noUi-'
        start: @model.range
        range: {
          min: @model.start
          max: @model.end
        }
        step: @model.step
        behaviour: 'drag'
        connect: [false, true, false]
        tooltips: true
        orientation: @model.orientation
      })

      @el.noUiSlider.on 'update', ([min, max], _handle) =>
        @_update([parseFloat(min), parseFloat(max)])
      @el.noUiSlider.on 'change', ([min, max], _handle) =>
        @_change([parseFloat(min), parseFloat(max)])
    else
      @el.noUiSlider.updateOptions({
        start: @model.range
        range: {
          min: @model.start
          max: @model.end
        }
        step: @model.step
      })

    return @

  _update: (range) ->
    logger.debug("slider update value = [#{range.join(", ")}]")
    @model.range = range
    @callback_wrapper?()

  _change: (range) ->
    logger.debug("slider change value = [#{range.join(", ")}]")
    switch @model.callback_policy
      when 'mouseup', 'throttle'
        @model.callback?.execute(@model)

export class RangeSlider extends Widget
  type: "RangeSlider"
  default_view: RangeSliderView

  @define {
    range:             [ p.Any,         [0.1, 0.9]   ]
    start:             [ p.Number,      0            ]
    end:               [ p.Number,      1            ]
    step:              [ p.Number,      0.1          ]
    orientation:       [ p.Orientation, "horizontal" ]
    callback:          [ p.Instance                  ]
    callback_throttle: [ p.Number,      200          ]
    callback_policy:   [ p.String,      "throttle"   ] # TODO (bev) enum
  }
