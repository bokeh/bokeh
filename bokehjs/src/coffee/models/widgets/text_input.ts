import {logger} from "core/logging"
import * as p from "core/properties"
import {empty, label, input} from "core/dom"

import {InputWidget, InputWidgetView} from "./input_widget"

export class TextInputView extends InputWidgetView
  className: "bk-widget-form-group"

  initialize: (options) ->
    super(options)
    @render()

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @render())

  render: () ->
    super()

    empty(@el)

    labelEl = label({for: @model.id}, @model.title)
    @el.appendChild(labelEl)

    @inputEl = input({
      type:"text"
      class: "bk-widget-form-input",
      id: @model.id,
      name: @model.name,
      value: @model.value,
      disabled: @model.disabled,
      placeholder: @model.placeholder,
    })
    @inputEl.addEventListener("change", () => @change_input())
    @el.appendChild(@inputEl)

    # TODO - This 35 is a hack we should be able to compute it
    if @model.height
      @inputEl.style.height = "#{@model.height - 35}px"
    return @

  change_input: () ->
    value = @inputEl.value
    logger.debug("widget/text_input: value = #{value}")
    @model.value = value
    super()

export class TextInput extends InputWidget
  type: "TextInput"
  default_view: TextInputView

  @define {
    value: [ p.String, "" ]
    placeholder: [ p.String, "" ]
  }
