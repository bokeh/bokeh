_ = require "underscore"
Model = require "../../model"
p = require "../../core/properties"

class LayoutDOM extends Model
  type: "LayoutDOM"

  @define {
      height:   [ p.Number, null ]
      width:    [ p.Number, null ]
      disabled: [ p.Bool, false ]
    }

module.exports =
  Model: LayoutDOM
