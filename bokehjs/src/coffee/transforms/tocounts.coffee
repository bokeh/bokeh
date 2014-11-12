define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class ToCounts extends HasProperties
    type: "ToCounts"

  class ToCountss extends Collection
    model: ToCounts

  return {
    "Model": ToCounts
    "Collection": new ToCountss()
  }
