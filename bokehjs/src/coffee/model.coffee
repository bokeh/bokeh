_ = require "underscore"
HasProps = require "./core/has_props"
p = require "./core/properties"

class Model extends HasProps
  type: "Model"

  @define {
    tags: [ p.Array, [] ]
    name: [ p.String    ]
  }

module.exports = Model
