_ = require "underscore"

p = require "../../core/properties"

AbstractButton = require "./abstract_button"


class ButtonView extends AbstractButton.View

  change_input: () ->
    @model.clicks = @model.clicks + 1
    super()


class Button extends AbstractButton.Model
  type: "Button"
  default_view: ButtonView

  @define {
    clicks: [ p.Number, 0        ]
  }

module.exports =
  Model: Button
  View: ButtonView
