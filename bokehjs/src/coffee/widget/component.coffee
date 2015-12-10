_ = require "underscore"
HasParent = require "../common/has_parent"

class Component extends HasParent
  type: "Component"

  defaults: ->
    return _.extend {}, super(), {
      disabled: false
    }

module.exports =
  Model: Component