define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Ratio extends HasProperties
    type: "Ratio"

  class Ratios extends Collection
    model: Ratio

  return {
    "Model": Ratio
    "Collection": new Ratios()
  }
