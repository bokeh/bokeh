define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Spread extends HasProperties
    type: "Spread"

  class Spreads extends Collection
    model: Spread

  return {
    "Model": Spread
    "Collection": new Spreads()
  }
