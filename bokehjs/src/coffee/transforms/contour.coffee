define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Contour extends HasProperties
    type: "Contour"

  class Contours extends Collection
    model: Contour

  return {
    "Model": Contour
    "Collection": new Contours()
  }
