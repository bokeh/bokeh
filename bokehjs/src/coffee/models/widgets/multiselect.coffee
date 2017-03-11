import * as p from "core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"

import multiselecttemplate from "./multiselecttemplate"


export class MultiSelectView extends InputWidgetView
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
    @listenTo(@model, 'change:size', @render)

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
    # Note that some browser implementations might not reduce
    # the number of visible options for size <= 3.
    @$el.find('select').attr('size', this.model.size)

  change_input: () ->
    # Haven't checked if :focus selector works for IE <= 7
    is_focused = @$el.find('select:focus').size()
    value = @$el.find('select').val()
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
      @$el.find('select').focus()

export class MultiSelect extends InputWidget
  type: "MultiSelect"
  default_view: MultiSelectView

  @define {
      value:   [ p.Array, [] ]
      options: [ p.Array, [] ]
      size:    [ p.Number, 4 ]  # 4 is the HTML default
    }
