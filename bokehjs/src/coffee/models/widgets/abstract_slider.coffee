import * as noUiSlider from "nouislider"

import * as p from "core/properties"
import {label, input, div} from "core/dom"
import {logger} from "core/logging"
import {throttle} from "core/util/callback"

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
    if not @sliderEl?
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

    @el.classList.add("bk-slider")

    if not @sliderEl?
      @sliderEl = div()
      @el.appendChild(@sliderEl)

      noUiSlider.create(@sliderEl, {
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

      @sliderEl.noUiSlider.on('slide',  (_, __, values) => @_slide(values))
      @sliderEl.noUiSlider.on('change', (_, __, values) => @_change(values))

      toggleTooltip = (i, show) =>
        handle = @sliderEl.querySelectorAll(".#{prefix}handle")[i]
        tooltip = handle.querySelector(".#{prefix}tooltip")
        tooltip.style.display = if show then 'block' else ''

      @sliderEl.noUiSlider.on('start', (_, i) => toggleTooltip(i, true))
      @sliderEl.noUiSlider.on('end',   (_, i) => toggleTooltip(i, false))
    else
      @sliderEl.noUiSlider.updateOptions({
        range: {min: start, max: end}
        start: value
        step: step
      })

    if @titleEl?
      @el.removeChild(@titleEl)
    if @valueEl?
      @el.removeChild(@valueEl)

    if @model.title?
      if @model.title.length != 0
        @titleEl = label({}, "#{@model.title}:")
        @el.insertBefore(@titleEl, @sliderEl)

      if @model.show_value
        pretty = (@model.pretty(v) for v in value).join(" .. ")
        @valueEl = div({class: "bk-slider-value"}, pretty)
        @el.insertBefore(@valueEl, @sliderEl)

    if not @model.disabled
      @sliderEl.querySelector(".#{prefix}connect")
               .style
               .backgroundColor = @model.bar_color

    if @model.disabled
      @sliderEl.setAttribute('disabled', true)
    else
      @sliderEl.removeAttribute('disabled')

    return @

  _slide: (values) ->
    value = @_calc_from(values)
    pretty = (@model.pretty(v) for v in values).join(" .. ")
    logger.debug("[slider slide] value = #{pretty}")
    if @valueEl?
      @valueEl.textContent = pretty
    @model.value = value
    @callback_wrapper?()

  _change: (values) ->
    value = @_calc_from(values)
    pretty = (@model.pretty(v) for v in values).join(" .. ")
    logger.debug("[slider change] value = #{pretty}")
    if @valueEl?
      @valueEl.value = pretty
    @model.value = value
    switch @model.callback_policy
      when 'mouseup', 'throttle'
        @model.callback?.execute(@model)

export class AbstractSlider extends Widget
  type: "AbstractSlider"
  default_view: AbstractSliderView

  @define {
    title:             [ p.String,      ""           ]
    show_value:        [ p.Bool,        true         ]
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
