_ = require "underscore"

{logger} = require "../../core/logging"
p = require "../../core/properties"

InputWidget = require "./input_widget"
Widget = require "./widget"

template = require "./selecttemplate"


class SelectView extends Widget.View
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

  @override {
      height: 65
    }

module.exports =
  Model: Select
  View: SelectView
