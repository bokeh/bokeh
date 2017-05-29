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
    @connect(@model.change, () -> @render())

  render: () ->
    super()
    @el.appendChild(@template(@model.attributes))
    # TODO - This 35 is a hack we should be able to compute it
    if @model.height
      @el.querySelector('input').style.height = "#{@model.height - 35}px"
    return @

  change_input: () ->
    value = @el.querySelector('input').value
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
