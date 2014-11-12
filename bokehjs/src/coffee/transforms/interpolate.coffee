define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class Interpolate extends HasProperties
    type: "Interpolate"

  class Interpolates extends Collection
    model: Interpolate

  return {
    Model: Interpolate
    Collection: new Interpolates()
  }
