HasProperties = require "./has_properties"
{logger} = require "./logging"

class ToolEvents extends HasProperties
  type: 'ToolEvents'

module.exports =
  Model: ToolEvents