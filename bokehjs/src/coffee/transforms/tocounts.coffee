define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class ToCounts extends Transform
    type: "ToCounts"

  class ToCountss extends Collection
    model: ToCounts

  return {
    Model: ToCounts
    Collection: new ToCountss()
  }
