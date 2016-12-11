import * as _ from "underscore"

import * as p from "../../core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"

import multiselecttemplate from "./multiselecttemplate"


export class MultiSelectView extends InputWidgetView
  tagName: "div"
  template: multiselecttemplate
  events:
    "change select": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change:value', @render_selection)
    @listenTo(@model, 'change:options', @render)
    @listenTo(@model, 'change:name', @render)
    @listenTo(@model, 'change:title', @render)

  render: () ->
    super()
    @$el.empty()
    html = @template(@model.attributes)
    @$el.html(html)
    @render_selection()
    return @

  render_selection: () =>
    values = {}
    for x in @model.value
      values[x] = true
    @$el.find('option').each((el) =>
      el = @$el.find(el)
      if values[el.attr('value')]
        el.attr('selected', 'selected')
    )

  change_input: () ->
    value = @$el.find('select').val()
    if value
      @model.value = value
    else
      @model.value = []
    super()

export class MultiSelect extends InputWidget
  type: "MultiSelect"
  default_view: MultiSelectView

  @define {
      value:   [ p.Array, [] ]
      options: [ p.Array, [] ]
    }
