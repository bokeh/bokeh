_ = require "underscore"
Layout = require "./layout"

class BaseBox extends Layout.Model
  type: "BaseBox"

  defaults: ->
    return _.extend {}, super(), {
      width: null
      height: null
    }

module.exports =
  Model: BaseBox