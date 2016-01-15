_ = require "underscore"
HasProperties = require "../common/has_properties"

class Component extends HasProperties
  type: "Component"

  defaults: ->
    return _.extend {}, super(), {
      disabled: false
    }

module.exports =
  Model: Component
