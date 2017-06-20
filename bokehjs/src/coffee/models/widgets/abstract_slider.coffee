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

  render: () ->
    if not @el.noUiSlider?
      # XXX: temporary workaround for _render_css()
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

    if @model.tooltips
      formatter =  {
        to: (value) => @model.pretty(value)
      }

      tooltips = ( formatter for i in [0...value.length] )
    else
      tooltips = false

    if not @el.noUiSlider?
      noUiSlider.create(@el, {
        cssPrefix: prefix
        range: {min: start, max: end}
        start: value
        step: step
        behaviour: @model.behaviour
        connect: @model.connected
        tooltips: tooltips
        orientation: @model.orientation
        direction: @model.direction
      })

      @el.noUiSlider.on('slide',  (_, __, values) => @_slide(values))
      @el.noUiSlider.on('change', (_, __, values) => @_change(values))

      toggleTooltip = (i, show) =>
        handle = @el.querySelectorAll(".#{prefix}handle")[i]
        tooltip = handle.querySelector(".#{prefix}tooltip")
        tooltip.style.display = if show then 'block' else ''

      @el.noUiSlider.on('start', (_, i) => toggleTooltip(i, true))
      @el.noUiSlider.on('end',   (_, i) => toggleTooltip(i, false))
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
    logger.debug("[slider slide] value = #{(@model.pretty(v) for v in values).join(", ")}")
    @model.value = value
    @callback_wrapper?()

  _change: (values) ->
    value = @_calc_from(values)
    logger.debug("[slider change] value = #{(@model.pretty(v) for v in values).join(", ")}")
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
    format:            [ p.String                    ]
    orientation:       [ p.Orientation, "horizontal" ]
    direction:         [ p.Any,         "ltr"        ]
    tooltips:          [ p.Boolean,     true         ]
    callback:          [ p.Instance                  ]
    callback_throttle: [ p.Number,      200          ]
    callback_policy:   [ p.String,      "throttle"   ] # TODO (bev) enum
    bar_color:         [ p.Color,       "#3fb8af"    ]
  }

  behaviour: null
  connected: false

  _formatter: (value, format) -> "#{value}"

  pretty: (value) -> @_formatter(value, @format)
