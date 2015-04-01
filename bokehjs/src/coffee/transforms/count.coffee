Collection = require "../common/collection"
Transform = require "./transform"

class Count extends Transform
  type: "Count"

class Counts extends Collection
  model: Count

module.exports =
  Model: Count
  Collection: new Counts()