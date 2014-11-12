define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class Id extends Transform
    type: "Id"

  class Ids extends Collection
    model: Id

  return {
    Model: Id
    Collection: new Ids()
  }
