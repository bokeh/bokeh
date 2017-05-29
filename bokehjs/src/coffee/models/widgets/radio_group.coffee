import * as $ from "jquery"

import * as p from "core/properties"
import {empty, input, label, div} from "core/dom"
import {uniqueId} from "core/util/string"

import {Widget, WidgetView} from "./widget"

export class RadioGroupView extends WidgetView
  events:
    "change input": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @connect(@model.change, () -> @render())

  render: () ->
    super()
    empty(@el)

    name = uniqueId("RadioGroup")
    active = @model.active
    for label, i in @model.labels
      inputEl = input({type: "radio", name: name, value: "#{i}"})
      if @model.disabled then inputEl.disabled = true
      if i == active then inputEl.checked = true

      labelEl = label({}, inputEl, label)
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
