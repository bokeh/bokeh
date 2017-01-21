import * as noUiSlider from "nouislider"

import {logger} from "core/logging"
import * as p from "core/properties"
import {empty} from "core/dom"
import {throttle} from "core/util/callback"

import {Widget, WidgetView} from "./widget"

export class SliderView extends WidgetView

  initialize: (options) ->
    super(options)
    @render()

  connect_signals: () ->
    @connect(@model.change, () => @render())

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
        start: [@model.value]
        range: {
          min: @model.start
          max: @model.end
        }
        step: @model.step
        behaviour: 'tap'
        connect: [false, true]
        tooltips: true
        orientation: @model.orientation
      })

      @el.noUiSlider.on 'update', ([value], _handle) =>
        @_update(parseFloat(value))
      @el.noUiSlider.on 'change', ([value], _handle) =>
        @_change(parseFloat(value))
    else
      @el.noUiSlider.updateOptions({
        start: [@model.value]
        range: {
          min: @model.start
          max: @model.end
        }
        step: @model.step
      })

    return @

  _update: (value) ->
    logger.debug("slider update value = #{value}")
    @model.value = value
    @callback_wrapper?()

  _change: (value) ->
    logger.debug("slider change value = #{value}")
    switch @model.callback_policy
      when 'mouseup', 'throttle'
        @model.callback?.execute(@model)

export class Slider extends Widget
  type: "Slider"
  default_view: SliderView

  @define {
    value:             [ p.Number,      0.5          ]
    start:             [ p.Number,      0            ]
    end:               [ p.Number,      1            ]
    step:              [ p.Number,      0.1          ]
    orientation:       [ p.Orientation, "horizontal" ]
    callback:          [ p.Instance                  ]
    callback_throttle: [ p.Number,      200          ]
    callback_policy:   [ p.String,      "throttle"   ] # TODO (bev) enum
  }
