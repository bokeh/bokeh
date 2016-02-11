_ = require "underscore"
HasProps = require "./core/has_props"

class Model extends HasProps
  type: "Model"

  defaults: ->
    return _.extend {}, super(), {
      tags: []
      name: null
    }

module.exports = Model
