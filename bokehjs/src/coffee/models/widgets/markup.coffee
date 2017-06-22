import * as p from "core/properties"
import {empty, div} from "core/dom"
import {extend} from "core/util/object"

import {Widget, WidgetView} from "./widget"

export class MarkupView extends WidgetView

  initialize: (options) ->
    super(options)
    @render()

  connect_signals: () ->
    super()
    @connect(@model.change, () -> @render())

  render: () ->
    super()
    empty(@el)
    style = extend({
      width: "#{@model.width}px",
      height: "#{@model.height}px",
    }, @model.style)
    @markupEl = div({style: style})
    @el.appendChild(@markupEl)

export class Markup extends Widget
  type: "Markup"

  initialize: (options) ->
    super(options)

  @define {
    text: [ p.String, '' ]
    style: [ p.Any, {} ]
  }
