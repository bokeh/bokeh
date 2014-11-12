define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class Ratio extends Transform.Model
    type: "Ratio"

  class Ratios extends Collection
    model: Ratio

  return {
    Model: Ratio
    Collection: new Ratios()
  }
