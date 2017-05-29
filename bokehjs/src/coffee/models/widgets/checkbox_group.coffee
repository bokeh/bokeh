import * as $ from "jquery"

import {Widget, WidgetView} from "./widget"
import * as p from "core/properties"
import {empty, input, label, div} from "core/dom"

export class CheckboxGroupView extends WidgetView
  events:
    "change input": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @connect(@model.change, () -> @render())

  render: () ->
    super()
    empty(@el)

    active = @model.active
    for label, i in @model.labels
      inputEl = input({type: "checkbox", value: "#{i}"})
      if @model.disabled then inputEl.disabled = true
      if i in active then inputEl.checked = true

      labelEl = label({}, inputEl, label)
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
