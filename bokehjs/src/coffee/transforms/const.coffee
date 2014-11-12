define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class Const extends Transform.Model
    type: "Const"

  class Consts extends Collection
    model: Const

  return {
    Model: Const
    Collection: new Consts()
  }
