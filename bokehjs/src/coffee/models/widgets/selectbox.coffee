_ = require "underscore"
BokehView = require "../../core/bokeh_view"
{logger} = require "../../core/logging"
template = require "./selecttemplate"
InputWidget = require "./input_widget"

class SelectView extends BokehView
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

  defaults: ->
    return _.extend {}, super(), {
      title: ''
      value: ''
      options: []
    }

module.exports =
  Model: Select
  View: SelectView
