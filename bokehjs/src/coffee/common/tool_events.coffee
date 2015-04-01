Backbone = require "backbone"
HasProperties = require "./has_properties"
{logger} = require "./logging"

class ToolEvents extends HasProperties
  type: 'ToolEvents'

class ToolEventsCollection extends Backbone.Collection
  model: ToolEvents

module.exports =
  Model: ToolEvents
  Collection: new ToolEventsCollection()
