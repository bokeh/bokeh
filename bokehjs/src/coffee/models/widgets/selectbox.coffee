import {empty, label, select, option, optgroup} from "core/dom"
import {isString, isArray} from "core/util/types"
import {logger} from "core/logging"
import * as p from "core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"

export class SelectView extends InputWidgetView
  initialize: (options) ->
    super(options)
    @render()

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @render())

  build_options: (values) ->
     return values.map (el) =>
      if isString(el)
        value = _label  = el
      else
        [value, _label] = el

      selected = @model.value == value
      return option({selected: selected, value: value}, _label)

  render: () ->
    super()
    empty(@el)

    labelEl = label({for: @model.id}, @model.title)
    @el.appendChild(labelEl)

    if isArray(@model.options)
     contents = @build_options( @model.options )
    else
     contents = []
     for key,value of @model.options
      contents.push optgroup({label: key}, @build_options( value ))

    @selectEl = select({class: "bk-widget-form-input", id: @model.id, name: @model.name}, contents)
    @selectEl.addEventListener("change", () => @change_input())
    @el.appendChild(@selectEl)

    return @

  change_input: () ->
    value = @selectEl.value
    logger.debug("selectbox: value = #{value}")
    @model.value = value
    super()

export class Select extends InputWidget
  type: "Select"
  default_view: SelectView

  @define {
    value:   [ p.String, '' ]
    options: [ p.Any,    [] ] # TODO (bev) is this used?
  }
