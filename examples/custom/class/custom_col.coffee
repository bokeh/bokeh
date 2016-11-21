Box = require "models/layouts/box"

class CustomView extends Box.View
  className: "bk-grid-column custom-column"

class Column extends Box.Model
  type: 'Column'
  default_view: CustomView

  constructor: (attrs, options) ->
    super(attrs, options)
    @_horizontal = false

module.exports =
  View: CustomView
  Model: Column
