import {empty, label, select, option} from "core/dom"
import {isString} from "core/util/types"
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

  render: () ->
    super()
    empty(@el)

    labelEl = label({for: @model.id}, @model.title)
    @el.appendChild(labelEl)

    options = @model.options.map (opt) =>
      if isString(opt)
        value = _label  = opt
      else
        [value, _label] = opt

      selected = @model.value == value
      return option({selected: selected, value: value}, _label)

    @selectEl = select({class: "bk-widget-form-input", id: @model.id, name: @model.name}, options)
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
