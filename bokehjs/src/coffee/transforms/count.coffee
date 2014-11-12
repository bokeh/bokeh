define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class Count extends Transform.Model
    type: "Count"

  class Counts extends Collection
    model: Count

  return {
    Model: Count
    Collection: new Counts()
  }
