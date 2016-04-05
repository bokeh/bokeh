_ = require "underscore"

Model = require "../model"
p = require "../core/properties"

class Component extends Model
  type: "Component"

  @define {
    disabled: [ p.Bool, false ]
  }

module.exports =
  Model: Component
