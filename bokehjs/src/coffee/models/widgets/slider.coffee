import * as noUiSlider from "nouislider"

import * as p from "core/properties"
import {logger} from "core/logging"
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

    if not @el.noUiSlider?
      noUiSlider.create(@el, {
        cssPrefix: 'bk-noUi-'
        start: [@model.value]
        range: {min: @model.start, max: @model.end}
        step: @model.step
        behaviour: 'tap'
        connect: [true, false]
        tooltips: true
        orientation: @model.orientation
        direction: @model.direction
      })

      @el.noUiSlider.on 'slide',  ([value], _handle) => @_slide(parseFloat(value))
      @el.noUiSlider.on 'change', ([value], _handle) => @_change(parseFloat(value))
    else
      @el.noUiSlider.updateOptions({
        start: [@model.value]
        range: {min: @model.start, max: @model.end}
        step: @model.step
      })

    if not @model.disabled
      @el.querySelector('.bk-noUi-connect')
         .style
         .backgroundColor = @model.bar_color

    if @model.disabled
      @el.setAttribute('disabled', true)
    else
      @el.removeAttribute('disabled')

    return @

  _slide: (value) ->
    logger.debug("slide = #{value}")
    @model.value = value
    @callback_wrapper?()

  _change: (value) ->
    logger.debug("slider value = #{value}")
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
    bar_color:         [ p.Color,       "#3fb8af"    ]
  }
