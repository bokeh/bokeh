_ = require "underscore"
ContinuumView = require "../common/continuum_view"
HasParent = require "../common/has_parent"
{logger} = require "../common/logging"
template = require "./selecttemplate"

class SelectView extends ContinuumView
  tagName: "div"
  template: template
  events:
    "change select": "change_input"

  change_input: () ->
    value = @$('select').val()
    logger.debug("selectbox: value = #{value}")
    @mset('value', value)
    @model.save()
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

class Select extends HasParent
  type: "Select"
  default_view: SelectView

  defaults: ->
    return _.extend {}, super(), {
      title: ''
      value: ''
      options: []
    }

module.exports =
  Model: Select
  View: SelectView