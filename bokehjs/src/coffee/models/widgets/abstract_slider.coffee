import * as noUiSlider from "nouislider"

import * as p from "../../core/properties"
import {logger} from "../../core/logging"
import {throttle} from "../../core/util/callback"

import {Widget, WidgetView} from "./widget"

export class AbstractSliderView extends WidgetView

  initialize: (options) ->
    super(options)
    @render()

  connect_signals: () ->
    @connect(@model.change, () => @render())

  _calc_to: () ->

  _calc_from: (values) ->

  _pretty_value: (value) ->
    return "#{value}"

  render: () ->
    super()

    if @model.callback?
      callback = () => @model.callback.execute(@model)

      switch @model.callback_policy
        when 'continuous'
          @callback_wrapper = callback
        when 'throttle'
          @callback_wrapper = throttle(callback, @model.callback_throttle)

    prefix = 'bk-noUi-'

    {start, end, value, step} = @_calc_to()

    _formatter = { to: (value) => @_pretty_value(value) }
    formatters = ( _formatter for i in [0...value.length] )

    if not @el.noUiSlider?
      noUiSlider.create(@el, {
        cssPrefix: prefix
        range: {min: start, max: end}
        start: value
        step: step
        behaviour: @model.behaviour
        connect: @model.connect
        tooltips: if @model.tooltips then formatters else false
        orientation: @model.orientation
        direction: @model.direction
      })

      @el.noUiSlider.on('slide',  (values, _handle) => @_slide(values))
      @el.noUiSlider.on('change', (values, _handle) => @_change(values))
    else
      @el.noUiSlider.updateOptions({
        range: {min: start, max: end}
        start: value
        step: step
      })

    if not @model.disabled
      @el.querySelector(".#{prefix}connect")
         .style
         .backgroundColor = @model.bar_color

    if @model.disabled
      @el.setAttribute('disabled', true)
    else
      @el.removeAttribute('disabled')

    return @

  _slide: (values) ->
    value = @_calc_from(values)
    logger.debug("[slider slide] value = #{value}")
    @model.value = value
    @callback_wrapper?()

  _change: (values) ->
    value = @_calc_from(values)
    logger.debug("[slider change] value = #{value}")
    @model.value = value
    switch @model.callback_policy
      when 'mouseup', 'throttle'
        @model.callback?.execute(@model)

export class AbstractSlider extends Widget
  type: "AbstractSlider"
  default_view: AbstractSliderView

  @define {
    start:             [ p.Any                       ]
    end:               [ p.Any                       ]
    value:             [ p.Any                       ]
    step:              [ p.Number,      1            ]
    orientation:       [ p.Orientation, "horizontal" ]
    direction:         [ p.Any,         "ltr"        ]
    tooltips:          [ p.Boolean,     true         ]
    callback:          [ p.Instance                  ]
    callback_throttle: [ p.Number,      200          ]
    callback_policy:   [ p.String,      "throttle"   ] # TODO (bev) enum
    bar_color:         [ p.Color,       "#3fb8af"    ]
  }

  @internal {
    behaviour: [ p.String ]
    connect:   [ p.Array  ]
  }
