_ = require "underscore"
Widget = require "./widget"

class TableWidget extends Widget.Model
  type: "TableWidget"

  defaults: ->
    return _.extend {}, super(), {
      source: null
    }

module.exports =
  Model: TableWidget