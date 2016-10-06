import * as _ from "underscore"

import {build_views} from "../../core/build_views"
import {logger} from "../../core/logging"
import * as p from "../../core/properties"

import * as InputWidget from "./input_widget"
import * as template from "./text_input_template"


class TextInputView extends InputWidget.View
  tagName: "div"
  attributes:
     class: "bk-widget-form-group"
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
    value = @$('input').val()
    logger.debug("widget/text_input: value = #{value}")
    @model.value = value
    super()

class TextInput extends InputWidget.Model
  type: "TextInput"
  default_view: TextInputView

  @define {
      value: [ p.String, "" ]
    }

export {
  TextInput as Model
  TextInputView as View
}
