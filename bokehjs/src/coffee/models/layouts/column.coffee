Box = require "./box"

class ColumnView extends Box.View
  className: "bk-grid-column"

class Column extends Box.Model
  type: 'Column'
  default_view: ColumnView

  constructor: (attrs, options) ->
    super(attrs, options)
    @_horizontal = false

module.exports =
  View: ColumnView
  Model: Column
