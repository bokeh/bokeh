define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class HDAlpha extends Transform
    type: "HDAlpha"

  class HDAlphas extends Collection
    model: HDAlpha

  return {
    Model: HDAlpha
    Collection: new HDAlphas()
  }
