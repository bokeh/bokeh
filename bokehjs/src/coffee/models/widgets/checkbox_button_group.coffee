import {button} from "bootstrap/button"

import {Widget, WidgetView} from "./widget"
import * as p from "core/properties"
import {empty, input, label} from "core/dom"
import template from "./button_group_template"

export class CheckboxButtonGroupView extends WidgetView
  template: template

  initialize: (options) ->
    super(options)
    @render()
    @connect(@model.change, () -> @render())

  render: () ->
    super()

    empty(@el)
    html = @template()
    @el.appendChild(html)

    active = @model.active
    for text, i in @model.labels
      inputEl = input({type: "checkbox", value: "#{i}"})
      inputEl.addEventListener("change", () => @change_input())
      if i in active then inputEl.checked = true
      labelEl = label({class: "bk-bs-btn"}, inputEl, text)
      labelEl.classList.add("bk-bs-btn-" + @model.button_type)
      if i in active then labelEl.classList.add("bk-bs-active")
      @el.querySelector('.bk-bs-btn-group').appendChild(labelEl)

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
