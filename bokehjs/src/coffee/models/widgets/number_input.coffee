import {logger} from "core/logging"
import * as p from "core/properties"
import {empty, label, input} from "core/dom"

import {InputWidget, InputWidgetView} from "./input_widget"

export class NumberInputView extends InputWidgetView
  className: "bk-widget-form-group"

  initialize: (options) ->
    super(options)
    @render()

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @render())

  render: () ->
    super()

    if not @inputEl?
      empty(@el)

      labelEl = label({for: @model.id}, @model.title)
      @el.appendChild(labelEl)


      @inputEl = input({
        type:"number"
        class: "bk-widget-form-input bk-bs-form-control",
        id: @model.id,
        name: @model.name,
        value: @model.value,
        disabled: @model.disabled,
        min: @model.start,
        max: @model.end
        step: @model.step
      })
      @inputEl.addEventListener("change", () => @change_input())
      @inputEl.addEventListener("input", () => @input_event())
      @el.appendChild(@inputEl)
    else
      @inputEl.value = @model.value
      @inputEl.disabled = @model.disabled
      @inputEl.min = @model.start
      @inputEl.max = @model.end
      @inputEl.step = @model.step
    # TODO - This 35 is a hack we should be able to compute it
    if @model.height
      @inputEl.style.height = "#{@model.height - 35}px"
    return @

  change_input: () ->
    # The change event is fired after the user is done editing. Browsers do
    # not reliably enforce the limits, so we do it here
    value = if @inputEl.value != "" then parseFloat(@inputEl.value) else @model.start
    value = @model.start if value < @model.start
    value = @model.end if value > @model.end
    console.log("widget/number_input: value = #{value}")
    @model.value = value
    @inputEl.value = value
    @el.classList.remove("bk-bs-has-error")
    super()

  input_event: () ->
    # The input event is fired after each key press, but also when using the
    # up/down button or the scroll wheel. There is not method to know which
    # source the event is from. Because we don't want to interfere with the
    # user typing in a number we simply check if the number is valid and only
    # if it is we call the callback
    if @inputEl.value != ""
      value = parseFloat(@inputEl.value)
      if value >= @model.start and value <= @model.end
        console.log("input: value = #{value}")
        @model.value = value
        @el.classList.remove("bk-bs-has-error")
        @model.callback?.execute(@model)
      else
        @el.classList.add("bk-bs-has-error")
    else
      @el.classList.add("bk-bs-has-error")

export class NumberInput extends InputWidget
  type: "NumberInput"
  default_view: NumberInputView

  @define {
    value: [ p.Number, 0.0 ]
    start: [ p.Number, 0.0   ]
    end:   [ p.Number, 100.0 ]
    step:  [ p.Number, 1.0   ]
  }
