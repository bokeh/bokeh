define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class Interpolate extends Transform.Model
    type: "Interpolate"

  class Interpolates extends Collection
    model: Interpolate

  return {
    Model: Interpolate
    Collection: new Interpolates()
  }
