_ = require "underscore"

Widget = require "./widget"
p = require "../../core/properties"

class InputWidgetView extends Widget.View

class InputWidget extends Widget.Model
  type: "InputWidget"
  default_view: InputWidgetView

  props: ->
    return _.extend {}, super(), {
      callback: [ p.Instance   ]
      title:    [ p.String, '' ]
    }

module.exports =
  Model: InputWidget
  View: InputWidgetView
