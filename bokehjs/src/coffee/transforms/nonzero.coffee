Collection = require "../common/collection"
Transform = require "./transform"

class NonZero extends Transform
  type: "NonZero"

class NonZeros extends Collection
  model: NonZero

module.exports =
  Model: NonZero
  Collection: new NonZeros()