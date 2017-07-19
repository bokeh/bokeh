import "jquery-ui/spinner"

import {logger} from "core/logging"
import * as p from "core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"
import template from "./number_input_template"


export class NumberInputView extends InputWidgetView
  className: "bk-widget-form-group"
  template: template

  initialize: (options) ->
    super(options)
    @listenTo(@model, 'change', @render)
    @$el.empty()
    html = @template(@model.attributes)
    @$el.html(html)
    @$el.find('input').spinner({
        spin: @spin,
        stop: @spinstop,
        change: @changevalue})
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
    super()
    max = @model.end
    min = @model.start
    step = @model.step or 1
    logger.debug("number input render: min, max, step = (#{min}, #{max}, #{step})")
    opts = {
        value: @model.value,
        min: min,
        max: max,
        step: step
    }
    @$el.find("input").spinner("option", opts)
#     @_prefix_ui() # TODO: Breaks functionality
    return @

  spinstop: (event, ui) =>
    logger.debug("spin stop")
    if @model.callback_policy == 'mouseup' or @model.callback_policy == 'throttle'
      @model.callback?.execute(@model)

  spin: (event, ui) =>
    value = ui.value
    logger.debug("spin value = #{value}")
    @model.value = value
    if @callbackWrapper then @callbackWrapper()

  changevalue: (event, ui) =>
    value = @$el.find("input").spinner("value")
    @model.value = value
    @model.callback?.execute(@model)

export class NumberInput extends InputWidget
  type: "NumberInput"
  default_view: NumberInputView

  @define {
      value:             [ p.Number,      0            ]
      start:             [ p.Number,      0            ]
      end:               [ p.Number,      100          ]
      step:              [ p.Number,      1            ]
      callback_throttle: [ p.Number,      200          ]
      callback_policy:   [ p.String,      "throttle"   ] # TODO (bev) enum
    }
