_ = require "underscore"

InputWidget = require "./input_widget"
template = require "./text_input_template"
build_views = require "../../common/build_views"
BokehView = require "../../core/bokeh_view"
{logger} = require "../../core/logging"
p = require "../../core/properties"

class TextInputView extends BokehView
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
    @$el.html(@template(@model.attributes))
    return @

  change_input: () ->
    value = @$('input').val()
    logger.debug("widget/text_input: value = #{value}")
    @mset('value', value)
    @mget('callback')?.execute(@model)

class TextInput extends InputWidget.Model
  type: "TextInput"
  default_view: TextInputView

  @define {
      value: [ p.String, "" ]
    }

module.exports =
  Model: TextInput
  View: TextInputView
