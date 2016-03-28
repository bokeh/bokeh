_ = require "underscore"
Layout = require "./layout"
p = require "../../core/properties"

class BaseBox extends Layout.Model
  type: "BaseBox"

  props: ->
    return _.extend {}, super(), {
      height: [ p.Number, null ]
      width:  [ p.Number, null ]
    }

module.exports =
  Model: BaseBox
