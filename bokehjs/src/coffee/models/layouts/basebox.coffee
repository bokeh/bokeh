_ = require "underscore"
Layout = require "./layout"
p = require "../../core/properties"

class BaseBox extends Layout.Model
  type: "BaseBox"

  @define {
      children: [ p.Array, [] ]
      height:   [ p.Number, null ]
      width:    [ p.Number, null ]
    }

module.exports =
  Model: BaseBox
