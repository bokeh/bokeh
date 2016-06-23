_ = require "underscore"

Widget = require "./widget"
p = require "../../core/properties"

class InputWidgetView extends Widget.View

  render: () ->
    super()
    @$el.find('input').prop("disabled", @model.disabled)

  change_input: () ->
    @mget('callback')?.execute(@model)


class InputWidget extends Widget.Model
  type: "InputWidget"
  default_view: InputWidgetView

  @define {
      callback: [ p.Instance   ]
      title:    [ p.String, '' ]
    }

module.exports =
  Model: InputWidget
  View: InputWidgetView
