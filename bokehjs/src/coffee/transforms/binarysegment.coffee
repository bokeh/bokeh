define [
  "common/collection",
  "./transform",
], (Collection, Transform) ->

  class BinarySegment extends Transform
    type: "BinarySegment"

  class BinarySegments extends Collection
    model: BinarySegment

  return {
    Model: BinarySegment
    Collection: new BinarySegments()
  }
