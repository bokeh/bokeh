define [
  "common/collection",
  "common/has_properties",
], (Collection, HasProperties) ->

  class BinarySegment extends HasProperties
    type: "BinarySegment"

  class BinarySegments extends Collection
    model: BinarySegment

  return {
    "Model": BinarySegment
    "Collection": new BinarySegments()
  }
