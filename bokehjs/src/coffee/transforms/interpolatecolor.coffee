define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class InterpolateColor extends Transform.Model
    type: "InterpolateColor"

  class InterpolateColors extends Collection
    model: InterpolateColor

  return {
    Model: InterpolateColor
    Collection: new InterpolateColors()
  }
