define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Const extends HasProperties
    type: "Const"

  class Consts extends Collection
    model: Const

  return {
    "Model": Const
    "Collection": new Consts()
  }
