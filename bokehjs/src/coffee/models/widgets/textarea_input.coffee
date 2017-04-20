import {logger} from "core/logging"
import * as p from "core/properties"

import {InputWidget, InputWidgetView} from "./input_widget"
import template from "./textarea_input_template"


export class TextareaInputView extends InputWidgetView
  className: "bk-widget-form-group"
  template: template
  events:
    "change textarea": "change_input"

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    super()
    @$el.html(@template(@model.attributes))

  change_input: () ->
    value = @$el.find('textarea').val()
    logger.debug("widget/textarea_input: value = #{value}")
    @model.value = value
    super()

export class TextareaInput extends InputWidget
  type: "TextareaInput"
  default_view: TextareaInputView

  @define {
      value:       [ p.String, "" ]
      placeholder: [ p.String, "" ]
      cols:        [ p.Number, 20 ] # 20 is the HTML default
      max_length:  [ p.Number, "" ]
      rows:        [ p.Number, "" ]
    }
