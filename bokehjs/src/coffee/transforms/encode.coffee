define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Encode extends HasProperties
    type: "Encode"

  class Encodes extends Collection
    model: Encode

  return {
    "Model": Encode
    "Collection": new Encodes()
  }
