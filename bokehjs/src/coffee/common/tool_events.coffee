HasProperties = require "./has_properties"
{logger} = require "./logging"

class ToolEvents extends HasProperties
  type: 'ToolEvents'

  defaults: () ->
    return {
      geometries: []
      name: null
      tags: []
    }

module.exports =
  Model: ToolEvents