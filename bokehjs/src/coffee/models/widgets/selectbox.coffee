_ = require "underscore"

InputWidget = require "./input_widget"
template = require "./selecttemplate"
BokehView = require "../../core/bokeh_view"
{logger} = require "../../core/logging"
p = require "../../core/properties"

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

  @define {
      value:   [ p.String, '' ]
      options: [ p.Any,    [] ] # TODO (bev) is this used?
    }

module.exports =
  Model: Select
  View: SelectView
