_ = require "underscore"

p = require "../../core/properties"
LayoutBox = require "./layout_box"

class LayoutComponent extends LayoutBox.Model
  type: 'LayoutComponent'

  props: ->
    return _.extend {}, super(), {
      disabled: [ p.Bool, false ]
    }

module.exports =
  Model: LayoutComponent
