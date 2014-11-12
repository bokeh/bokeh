define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class Interpolate extends Transform
    type: "Interpolate"

  class Interpolates extends Collection
    model: Interpolate

  return {
    Model: Interpolate
    Collection: new Interpolates()
  }
