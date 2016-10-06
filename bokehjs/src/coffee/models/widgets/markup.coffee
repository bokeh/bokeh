import * as p from "../../core/properties"

import * as Widget from "./widget"
import * as template from "./markup_template"


class MarkupView extends Widget.View
  template: template

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()
    @$el.empty()
    @$el.html(@template())
    if @model.height
      @$el.height(@model.height)
    if @model.width
      @$el.width(@model.width)


class Markup extends Widget.Model
  type: "Markup"

  initialize: (options) ->
    super(options)

  @define {
    text: [ p.String, '' ]
  }

module.exports =
  Model: Markup
  View: MarkupView
