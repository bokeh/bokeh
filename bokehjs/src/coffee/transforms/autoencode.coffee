define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class AutoEncode extends Transform
    type: "AutoEncode"

  class AutoEncodes extends Collection
    model: AutoEncode

  return {
    Model: AutoEncode
    Collection: new AutoEncodes()
  }
