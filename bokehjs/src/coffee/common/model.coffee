_ = require "underscore"
HasProperties = require "./has_properties"

class Model extends HasProperties
  type: "Model"

  defaults: ->
    return _.extend {}, super(), {
      tags: []
      name: null
    }

module.exports = Model
