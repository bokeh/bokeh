define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class Const extends Transform
    type: "Const"

  class Consts extends Collection
    model: Const

  return {
    Model: Const
    Collection: new Consts()
  }
