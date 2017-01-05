import * as _ from "underscore"
import * as $ from "jquery"
import "bootstrap/button"

import * as p from "../../core/properties"

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

    name = _.uniqueId("RadioButtonGroup")
    active = @model.active
    for label, i in @model.labels
      $input = $('<input type="radio">').attr(name: name, value: "#{i}")
      if i == active then $input.prop("checked", true)
      $label = $('<label class="bk-bs-btn"></label>')
      $label.text(label).prepend($input)
      $label.addClass("bk-bs-btn-" + @model.button_type)
      if i == active then $label.addClass("bk-bs-active")
      @$el.find('.bk-bs-btn-group').append($label)

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
