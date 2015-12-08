_ = require "underscore"
Widget = require "./widget"

class InputWidget extends Widget.Model
  type: "InputWidget"

  defaults: ->
    return _.extend {}, super(), {
      callback: null
      title: ""
    }

module.exports =
  Model: InputWidget