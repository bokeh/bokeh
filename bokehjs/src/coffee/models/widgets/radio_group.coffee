import * as _ from "underscore"
import * as $ from "jquery"

import * as p from "../../core/properties"

import {Widget, WidgetView} from "./widget"

export class RadioGroupView extends WidgetView
  tagName: "div"
  events:
    "change input": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()
    @$el.empty()

    name = _.uniqueId("RadioGroup")
    active = @model.active
    for label, i in @model.labels
      $input = $('<input type="radio">').attr(name: name, value: "#{i}")
      if @model.disabled then $input.prop("disabled", true)
      if i == active then $input.prop("checked", true)

      $label = $('<label></label>').text(label).prepend($input)
      if @model.inline
          $label.addClass("bk-bs-radio-inline")
          @$el.append($label)
      else
          $div = $('<div class="bk-bs-radio"></div>').append($label)
          @$el.append($div)
    return @

  change_input: () ->
    active = (i for radio, i in @$el.find("input") when radio.checked)
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
