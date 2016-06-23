_ = require "underscore"

{logger} = require "../../core/logging"
p = require "../../core/properties"

InputWidget = require "./input_widget"

template = require "./selecttemplate"


class SelectView extends InputWidget.View
  template: template
  events:
    "change select": "change_input"

  change_input: () ->
    super()
    value = @$('select').val()
    logger.debug("selectbox: value = #{value}")
    @mset('value', value)

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
