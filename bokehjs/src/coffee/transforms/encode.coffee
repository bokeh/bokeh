define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class Encode extends Transform.Model
    type: "Encode"

  class Encodes extends Collection
    model: Encode

  return {
    Model: Encode
    Collection: new Encodes()
  }
