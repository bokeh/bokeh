import {empty, input, label, div} from "core/dom"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"

export class CheckboxGroupView extends WidgetView
  initialize: (options) ->
    super(options)
    @render()

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @render())

  render: () ->
    super()
    empty(@el)

    active = @model.active
    for text, i in @model.labels
      inputEl = input({type: "checkbox", value: "#{i}"})
      inputEl.addEventListener("change", () => @change_input())

      if @model.disabled then inputEl.disabled = true
      if i in active then inputEl.checked = true

      labelEl = label({}, inputEl, text)
      if @model.inline
        labelEl.classList.add("bk-bs-checkbox-inline")
        @el.appendChild(labelEl)
      else
        divEl = div({class: "bk-bs-checkbox"}, labelEl)
        @el.appendChild(divEl)

    return @

  change_input: () ->
    active = (i for checkbox, i in @el.querySelectorAll("input") when checkbox.checked)
    @model.active = active
    @model.callback?.execute(@model)

export class CheckboxGroup extends Widget
  type: "CheckboxGroup"
  default_view: CheckboxGroupView

  @define {
      active:   [ p.Array, []    ]
      labels:   [ p.Array, []    ]
      inline:   [ p.Bool,  false ]
      callback: [ p.Instance ]
    }
