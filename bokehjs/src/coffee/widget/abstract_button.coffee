_ = require "underscore"
Widget = require "./widget"

class AbstractButton extends Widget.Model
  type: "AbstractButton"

  defaults: ->
    return _.extend {}, super(), {
      callback: null
      label: "Button"
      icon: null
      type: "default"
    }

module.exports =
  Model: AbstractButton