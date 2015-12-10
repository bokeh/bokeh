_ = require "underscore"
Widget = require "./widget"

class Layout extends Widget.Model
  type: "Layout"

  defaults: ->
    return _.extend {}, super(), {
      width: null
      height: null
    }

module.exports =
  Model: Layout