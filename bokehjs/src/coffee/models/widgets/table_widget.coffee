_ = require "underscore"

Widget = require "./widget"
p = require "../../core/properties"

class TableWidget extends Widget.Model
  type: "TableWidget"

  props: ->
    return _.extend {}, super(), {
      source: [ p.Instance ]
    }

module.exports =
  Model: TableWidget