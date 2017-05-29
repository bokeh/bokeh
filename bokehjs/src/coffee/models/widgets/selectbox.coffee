import {logger} from "core/logging"
import * as p from "core/properties"
import {empty} from "core/dom"

import {InputWidget, InputWidgetView} from "./input_widget"

import template from "./selecttemplate"


export class SelectView extends InputWidgetView
  template: template
  events:
    "change select": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @connect(@model.change, () -> @render())

  render: () ->
    super()
    empty(@el)
    html = @template(@model.attributes)
    @el.appendChild(html)
    return @

  change_input: () ->
    value = @el.querySelector('select').value
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
