import {empty, input, label, div} from "core/dom"
import {uniqueId} from "core/util/string"
import * as p from "core/properties"

import {Widget, WidgetView} from "./widget"

export class RadioGroupView extends WidgetView
  initialize: (options) ->
    super(options)
    @render()

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @render())

  render: () ->
    super()
    empty(@el)

    name = uniqueId()

    active = @model.active
    for text, i in @model.labels
      inputEl = input({type: "radio", name: name, value: "#{i}"})
      inputEl.addEventListener("change", () => @change_input())

      if @model.disabled then inputEl.disabled = true
      if i == active then inputEl.checked = true

      labelEl = label({}, inputEl, text)
      if @model.inline
        labelEl.classList.add("bk-bs-radio-inline")
        @el.appendChild(labelEl)
      else
        divEl = div({class: "bk-bs-radio"}, labelEl)
        @el.appendChild(divEl)
    return @

  change_input: () ->
    active = (i for radio, i in @el.querySelectorAll("input") when radio.checked)
    @model.active = active[0]
    @model.callback?.execute(@model)

export class RadioGroup extends Widget
  type: "RadioGroup"
  default_view: RadioGroupView

  @define {
      active:   [ p.Any,   null  ] # TODO (bev) better type?
      labels:   [ p.Array, []    ]
      inline:   [ p.Bool,  false ]
      callback: [ p.Instance ]
    }
