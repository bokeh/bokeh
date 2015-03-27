Collection = require "../common/collection"
Transform = require "./transform"

class BinarySegment extends Transform
  type: "BinarySegment"

class BinarySegments extends Collection
  model: BinarySegment

module.exports =
  Model: BinarySegment
  Collection: new BinarySegments()