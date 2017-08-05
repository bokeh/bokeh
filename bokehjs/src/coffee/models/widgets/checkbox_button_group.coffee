import {empty, input, label, div} from "core/dom"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"

export class CheckboxButtonGroupView extends WidgetView

  initialize: (options) ->
    super(options)
    @render()

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @render())

  render: () ->
    super()

    empty(@el)
    divEl = div({class: "bk-bs-btn-group"})
    @el.appendChild(divEl)

    active = @model.active
    for text, i in @model.labels
      inputEl = input({type: "checkbox", value: "#{i}", checked: i in active})
      inputEl.addEventListener("change", () => @change_input())
      labelEl = label({class: ["bk-bs-btn", "bk-bs-btn-#{@model.button_type}"]}, inputEl, text)
      if i in active then labelEl.classList.add("bk-bs-active")
      divEl.appendChild(labelEl)

    return @

  change_input: () ->
    active = (i for checkbox, i in @el.querySelectorAll("input") when checkbox.checked)
    @model.active = active
    @model.callback?.execute(@model)

export class CheckboxButtonGroup extends Widget
  type: "CheckboxButtonGroup"
  default_view: CheckboxButtonGroupView

  @define {
      active:      [ p.Array,  []        ]
      labels:      [ p.Array,  []        ]
      button_type: [ p.String, "default" ]
      callback:    [ p.Instance ]
    }
