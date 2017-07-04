import {InputWidget, InputWidgetView} from "./input_widget"

import {empty, input, label} from "core/dom"
import * as p from "core/properties"

import * as Pikaday from "pikaday"

Pikaday.prototype.adjustPosition = () ->
  if @_o.container
    return

  @el.style.position = 'absolute'

  field = @_o.trigger
  width = @el.offsetWidth
  height = @el.offsetHeight
  viewportWidth = window.innerWidth || document.documentElement.clientWidth
  viewportHeight = window.innerHeight || document.documentElement.clientHeight
  scrollTop = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop

  clientRect = field.getBoundingClientRect()
  left = clientRect.left + window.pageXOffset
  top = clientRect.bottom + window.pageYOffset

  # adjust left/top origin to bk-root
  left -= @el.parentElement.offsetLeft
  top -= @el.parentElement.offsetTop

  # default position is bottom & left
  if ((@_o.reposition && left + width > viewportWidth) ||
      (@_o.position.indexOf('right') > -1 && left - width + field.offsetWidth > 0))
    left = left - width + field.offsetWidth

  if ((@_o.reposition && top + height > viewportHeight + scrollTop) ||
      (@_o.position.indexOf('top') > -1 && top - height - field.offsetHeight > 0))
    top = top - height - field.offsetHeight

  @el.style.left = left + 'px'
  @el.style.top = top + 'px'

export class DatePickerView extends InputWidgetView

  className: "bk-widget-form-group"

  render: () ->
    super()

    if @_picker?
      @_picker.destroy()
    empty(@el)

    @labelEl = label({}, @model.title)
    @el.appendChild(@labelEl)

    @inputEl = input({type: "text", class: "bk-widget-form-input", disabled: @model.disabled})
    @el.appendChild(@inputEl)

    @_picker = new Pikaday({
      field: @inputEl,
      defaultDate: new Date(@model.value),
      setDefaultDate: true,
      minDate: if @model.min_date? then new Date(@model.min_date) else null,
      maxDate: if @model.max_date? then new Date(@model.max_date) else null,
      onSelect: @_on_select,
    })

    # move date picker's element from body to bk-root
    @_root_element.appendChild(@_picker.el)

    return @

  _on_select: (date) =>
    @model.value = date.toString()
    @change_input()

export class DatePicker extends InputWidget
  type: "DatePicker"
  default_view: DatePickerView

  @define {
    # TODO (bev) types
    value:    [ p.Any, Date.now() ]
    min_date: [ p.Any             ]
    max_date: [ p.Any             ]
  }
