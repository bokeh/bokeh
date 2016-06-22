_ = require "underscore"

p = require "../../core/properties"

AbstractButton = require "./abstract_button"


class ButtonView extends AbstractButton.View

  change_input: () ->
    super()
    @mset('clicks', @mget('clicks') + 1)


class Button extends AbstractButton.Model
  type: "Button"
  default_view: ButtonView

  @define {
    clicks: [ p.Number, 0        ]
  }

  @override {
    height: 45
  }

module.exports =
  Model: Button
  View: ButtonView
