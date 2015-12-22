_ = require "underscore"
ContinuumView = require "../common/continuum_view"
{logger} = require "../common/logging"
template = require "./selecttemplate"
InputWidget = require "./input_widget"

class SelectView extends ContinuumView
  tagName: "div"
  template: template
  events:
    "change select": "change_input"

  change_input: () ->
    value = @$('select').val()
    logger.debug("selectbox: value = #{value}")
    @mset('value', value)
    @mget('callback')?.execute(@model)

  initialize: (options) ->
    super(options)
    @render()
    @listenTo(@model, 'change', @render)

  render: () ->
    @$el.empty()
    html = @template(@model.attributes)
    @$el.html(html)
    return @

class Select extends InputWidget.Model
  type: "Select"
  default_view: SelectView

  # TODO (bev) figure out where this is coming from
  nonserializable_attribute_names: () ->
    super().concat(['escape'])

  defaults: ->
    return _.extend {}, super(), {
      title: ''
      value: ''
      options: []
    }

module.exports =
  Model: Select
  View: SelectView
