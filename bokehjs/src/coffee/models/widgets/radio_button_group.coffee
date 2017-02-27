import "bootstrap/button"

import {input, label} from "core/dom"
import * as p from "core/properties"
import {uniqueId} from "core/util/string"

import {Widget, WidgetView} from "./widget"
import template from "./button_group_template"


export class RadioButtonGroupView extends WidgetView
  events:
    "change input": "change_input"
  template: template

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()

    @$el.empty()
    html = @template()
    @$el.append(html)

    name = uniqueId("RadioButtonGroup")
    active = @model.active
    for text, i in @model.labels
      inputEl = input({type: "radio", name: name, value: "#{i}", checked: i == active})
      labelEl = label({class: ["bk-bs-btn", "bk-bs-btn-#{@model.button_type}"]}, inputEl, text)
      if i == active then labelEl.classList.add("bk-bs-active")
      @$el.find('.bk-bs-btn-group').append(labelEl)

    return @

  change_input: () ->
    active = (i for radio, i in @$el.find("input") when radio.checked)
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
