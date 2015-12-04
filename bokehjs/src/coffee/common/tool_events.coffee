_ = require "underscore"
HasProperties = require "./has_properties"
{logger} = require "./logging"

class ToolEvents extends HasProperties
  type: 'ToolEvents'

  defaults: ->
    return _.extend {}, super(), {
      geometries: []
    }

module.exports =
  Model: ToolEvents