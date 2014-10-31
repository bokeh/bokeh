
define [
  "backbone"
  "common/has_properties"
  "common/logging"
], (Backbone, HasProperties, Logging) ->

  logger = Logging.logger

  class ToolEvents extends HasProperties
     type: 'ToolEvents'

  class ToolEventsCollection extends Backbone.Collection
    model : ToolEvents

  return {
    "Model": ToolEvents
    "Collection": new ToolEventsCollection()
  }