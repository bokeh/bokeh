_ = require "underscore"
Model = require "../common/model"

class Component extends Model
  type: "Component"

  defaults: ->
    return _.extend {}, super(), {
      disabled: false
    }

module.exports =
  Model: Component
