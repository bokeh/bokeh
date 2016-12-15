import * as _ from "underscore"

import {logger} from "../../core/logging"
import * as p from "../../core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"

import template from "./selecttemplate"


export class SelectView extends InputWidgetView
  template: template
  events:
    "change select": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()
    @$el.empty()
    html = @template(@model.attributes)
    @$el.html(html)
    return @

  change_input: () ->
    value = @$el.find('select').val()
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
