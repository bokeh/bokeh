import {empty, input, label} from "core/dom"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"
import template from "./button_group_template"

export class RadioButtonGroupView extends WidgetView
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
      inputEl = input({type: "radio", value: "#{i}", checked: i == active})
      inputEl.addEventListener("change", () => @change_input())
      labelEl = label({class: ["bk-bs-btn", "bk-bs-btn-#{@model.button_type}"]}, inputEl, text)
      if i == active then labelEl.classList.add("bk-bs-active")
      @el.querySelector('.bk-bs-btn-group').appendChild(labelEl)

    return @

  change_input: () ->
    active = (i for radio, i in @el.querySelectorAll("input") when radio.checked)
    @model.active = active[0]
    @model.callback?.execute(@model)

export class RadioButtonGroup extends Widget
  type: "RadioButtonGroup"
  default_view: RadioButtonGroupView

  @define {
      active:      [ p.Any,    null      ] # TODO (bev) better type?
      labels:      [ p.Array,  []        ]
      button_type: [ p.String, "default" ]
      callback:    [ p.Instance ]
    }
