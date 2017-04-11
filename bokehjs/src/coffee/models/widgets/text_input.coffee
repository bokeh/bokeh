import {logger} from "core/logging"
import * as p from "core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"
import template from "./text_input_template"


export class TextInputView extends InputWidgetView
  className: "bk-widget-form-group"
  template: template
  events:
    "change input": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()
    @$el.html(@template(@model.attributes))
    # TODO - This 35 is a hack we should be able to compute it
    if @model.height
      @$el.find('input').height(@model.height - 35)
    return @

  change_input: () ->
    value = @$el.find('input').val()
    logger.debug("widget/text_input: value = #{value}")
    @model.value = value
    super()

export class TextInput extends InputWidget
  type: "TextInput"
  default_view: TextInputView

  @define {
      value: [ p.String, "" ]
      placeholder: [ p.String, "" ]
    }
