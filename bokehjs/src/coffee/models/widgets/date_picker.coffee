# requires $.datepicker()

import {empty} from "core/dom"
import * as p from "core/properties"
import {input, label} from "core/dom"

import {InputWidget, InputWidgetView} from "./input_widget"


export class DatePickerView extends InputWidgetView

  render: () ->
    super()
    empty(@el)
    @label = label({}, @model.title)
    @input = input({type: "text"})
    @datepicker = $(@input).datepicker({
      defaultDate: new Date(@model.value)
      minDate: if @model.min_date? then new Date(@model.min_date) else null
      maxDate: if @model.max_date? then new Date(@model.max_date) else null
      onSelect: @onSelect
    })
    @el.appendChild(@label)
    @el.appendChild(@input)
    return @

  onSelect: (dateText, ui) =>
    d = new Date(dateText)
    @model.value = d.toString()
    @model.callback?.execute(@model)

export class DatePicker extends InputWidget
  type: "DatePicker"
  default_view: DatePickerView

  @define {
      # TODO (bev) types
      value:    [ p.Any, Date.now() ]
      min_date: [ p.Any             ]
      max_date: [ p.Any             ]
    }
