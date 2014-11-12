define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class HDAlpha extends HasProperties
    type: "HDAlpha"

  class HDAlphas extends Collection
    model: HDAlpha

  return {
    "Model": HDAlpha
    "Collection": new HDAlphas()
  }
