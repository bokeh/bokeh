define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class Log extends Transform
    type: "Log"

  class Logs extends Collection
    model: Log

  return {
    Model: Log
    Collection: new Logs()
  }
