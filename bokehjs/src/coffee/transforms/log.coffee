define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Log extends HasProperties
    type: "Log"

  class Logs extends Collection
    model: Log

  return {
    "Model": Log
    "Collection": new Logs()
  }
