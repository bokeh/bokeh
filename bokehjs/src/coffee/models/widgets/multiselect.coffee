import * as p from "core/properties"
import {empty} from "core/dom"

import {InputWidget, InputWidgetView} from "./input_widget"

import multiselecttemplate from "./multiselecttemplate"


export class MultiSelectView extends InputWidgetView
  template: multiselecttemplate

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
    html = @template(@model.attributes)
    selectEl = html.querySelector("select")
    selectEl.addEventListener("change", () => @change_input())
    @el.appendChild(html)
    @render_selection()
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
    @el.querySelector('select').size = @model.size

  change_input: () ->
    is_focused = @el.querySelector('select:focus') != null
    value = @el.querySelector('select').value
    if value
      @model.value = value
    else
      @model.value = []
    super()
    # Restore focus back to the <select> afterwards,
    # so that even if python on_change callback is invoked,
    # focus remains on <select> and one can seamlessly scroll
    # up/down.
    if is_focused
      @el.querySelector('select').focus()

export class MultiSelect extends InputWidget
  type: "MultiSelect"
  default_view: MultiSelectView

  @define {
      value:   [ p.Array, [] ]
      options: [ p.Array, [] ]
      size:    [ p.Number, 4 ]  # 4 is the HTML default
    }
