import * as _ from "underscore"

{logger} = require "../../core/logging"
import * as p from "../../core/properties"

import * as InputWidget from "./input_widget"

import * as template from "./selecttemplate"


class SelectView extends InputWidget.View
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
    value = @$('select').val()
    logger.debug("selectbox: value = #{value}")
    @model.value = value
    super()


class Select extends InputWidget.Model
  type: "Select"
  default_view: SelectView

  @define {
      value:   [ p.String, '' ]
      options: [ p.Any,    [] ] # TODO (bev) is this used?
    }

module.exports =
  Model: Select
  View: SelectView
