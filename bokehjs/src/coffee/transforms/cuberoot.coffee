define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Cuberoot extends HasProperties
    type: "Cuberoot"

  class Cuberoots extends Collection
    model: Cuberoot

  return {
    "Model": Cuberoot
    "Collection": new Cuberoots()
  }
