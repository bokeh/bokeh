import {empty, input, label, div} from "core/dom"
import {uniqueId} from "core/util/string"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"

export class RadioButtonGroupView extends WidgetView

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

    name = uniqueId()

    active = @model.active
    for text, i in @model.labels
      inputEl = input({type: "radio", name: name, value: "#{i}", checked: i == active})
      inputEl.addEventListener("change", () => @change_input())
      labelEl = label({class: ["bk-bs-btn", "bk-bs-btn-#{@model.button_type}"]}, inputEl, text)
      if i == active then labelEl.classList.add("bk-bs-active")
      divEl.appendChild(labelEl)

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
