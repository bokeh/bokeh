import * as _ from "underscore"
import * as $ from "jquery"
import "bootstrap/button"

import {Widget, WidgetView} from "./widget"
import {BokehView} from "../../core/bokeh_view"
import * as p from "../../core/properties"
import template from "./button_group_template"


export class CheckboxButtonGroupView extends WidgetView
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

    active = @model.active
    for label, i in @model.labels
      $input = $('<input type="checkbox">').attr(value: "#{i}")
      if i in active then $input.prop("checked", true)
      $label = $('<label class="bk-bs-btn"></label>')
      $label.text(label).prepend($input)
      $label.addClass("bk-bs-btn-" + @model.button_type)
      if i in active then $label.addClass("bk-bs-active")
      @$el.find('.bk-bs-btn-group').append($label)

    return @

  change_input: () ->
    active = (i for checkbox, i in @$el.find("input") when checkbox.checked)
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
