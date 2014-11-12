define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class InterpolateColor extends HasProperties
    type: "InterpolateColor"

  class InterpolateColors extends Collection
    model: InterpolateColor

  return {
    Model: InterpolateColor
    Collection: new InterpolateColors()
  }
