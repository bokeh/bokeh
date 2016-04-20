_ = require "underscore"
LayoutDOM = require "./layout_dom"
p = require "../../core/properties"

class BaseBox extends LayoutDOM.Model
  type: "BaseBox"

  @define {
      children: [ p.Array, [] ]
    }

module.exports =
  Model: BaseBox
