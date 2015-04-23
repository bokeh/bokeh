_ = require "underscore"
build_views = require "../common/build_views"
ContinuumView = require "../common/continuum_view"
HasParent = require "../common/has_parent"
{logger} = require "../common/logging"
template = require "./text_input_template"

class TextInputView extends ContinuumView
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
    @model.save()
    @mget('callback')?.execute(@model)

class TextInput extends HasParent
  type: "TextInput"
  default_view: TextInputView

  defaults: ->
    return _.extend {}, super(), {
      name: ""
      value: ""
      title: ""
    }

module.exports =
  Model: TextInput
  View: TextInputView