import {empty, label, select, option} from "core/dom"
import {isString} from "core/util/types"
import * as p from "core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"

export class MultiSelectView extends InputWidgetView

  initialize: (options) ->
    super(options)
    @render()

  connect_signals: () ->
    super()
    @connect(@model.properties.value.change, () -> @render_selection())
    @connect(@model.properties.options.change, () -> @render())
    @connect(@model.properties.name.change, () -> @render())
    @connect(@model.properties.title.change, () -> @render())
    @connect(@model.properties.size.change, () -> @render())

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

      selected = value in @model.value
      return option({selected: selected, value: value}, _label)

    @selectEl = select({
      multiple: true,
      class: "bk-widget-form-input",
      id: @model.id,
      name: @model.name,
      size: @model.size}, options)
    @selectEl.addEventListener("change", () => @change_input())
    @el.appendChild(@selectEl)

    return @

  render_selection: () =>
    values = {}
    for x in @model.value
      values[x] = true
    for el in @el.querySelectorAll('option')
      if values[el.value]
        el.selected = 'selected'
    # Note that some browser implementations might not reduce
    # the number of visible options for size <= 3.
    @selectEl.size = @model.size

  change_input: () ->
    is_focused = @el.querySelector('select:focus') != null

    values = []
    for el in @el.querySelectorAll('option')
      if el.selected
        values.push(el.value)

    @model.value = values
    super()
    # Restore focus back to the <select> afterwards,
    # so that even if python on_change callback is invoked,
    # focus remains on <select> and one can seamlessly scroll
    # up/down.
    if is_focused
      @selectEl.focus()

export class MultiSelect extends InputWidget
  type: "MultiSelect"
  default_view: MultiSelectView

  @define {
      value:   [ p.Array, [] ]
      options: [ p.Array, [] ]
      size:    [ p.Number, 4 ]  # 4 is the HTML default
    }
