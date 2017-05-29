import * as p from "core/properties"
import {empty} from "core/dom"

import {Widget, WidgetView} from "./widget"
import template from "./markup_template"


export class MarkupView extends WidgetView
  template: template

  initialize: (options) ->
    super(options)
    @render()
    @connect(@model.change, () -> @render())

  render: () ->
    super()
    empty(@el)
    @el.appendChild(@template())

export class Markup extends Widget
  type: "Markup"

  initialize: (options) ->
    super(options)

  @define {
    text: [ p.String, '' ]
  }
