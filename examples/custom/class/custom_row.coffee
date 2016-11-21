Box = require "models/layouts/box"

class CustomView extends Box.View
  className: "bk-grid-row custom-row"

class Row extends Box.Model
  type: 'Row'
  default_view: CustomView

  constructor: (attrs, options) ->
    super(attrs, options)
    @_horizontal = true

module.exports =
  View: CustomView
  Model: Row
